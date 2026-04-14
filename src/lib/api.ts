const API_BASE = "http://localhost:6969/api/v1";

// ---------------------------------------------------------------------------
// NestJS response envelope — every endpoint returns this shape
// ---------------------------------------------------------------------------

type ApiEnvelope<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

/**
 * Unwraps the standard NestJS `{ success, message, data }` envelope.
 *
 * - If the HTTP response is not OK, delegates to `parseApiError` (throws).
 * - If `success` is false, throws with the server-supplied `message`.
 * - Otherwise returns `data` cast to `T`.
 *
 * Use this for every endpoint that returns a payload (GET, POST, PATCH).
 * For DELETE / void endpoints keep using the existing `parseApiError` path.
 */
export async function unwrapApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    await parseApiError(response);
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error("Server returned an unreadable response.");
  }

  if (!envelope.success) {
    throw new Error(envelope.message || "Request failed.");
  }

  return envelope.data as T;
}

// ---------------------------------------------------------------------------
// In-memory access token — never touches localStorage or sessionStorage.
// The refresh token lives exclusively in an HttpOnly cookie managed by the
// backend; the frontend never reads or writes it directly.
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

// ---------------------------------------------------------------------------
// Error parsing helper — exported so API modules can reuse it
// ---------------------------------------------------------------------------

export async function parseApiError(response: Response): Promise<never> {
  let message = `Request failed with status ${response.status}`;
  try {
    const body = await response.json();
    if (typeof body.message === "string" && body.message) {
      message = body.message;
    } else if (Array.isArray(body.message) && body.message.length > 0) {
      // NestJS validation errors come back as string[]
      message = (body.message as string[]).join(", ");
    } else if (typeof body.error === "string" && body.error) {
      message = body.error;
    }
  } catch {
    // Response body is not JSON — keep the default message
  }
  throw new Error(message);
}

// ---------------------------------------------------------------------------
// Build a normalised headers object from a RequestInit
// ---------------------------------------------------------------------------

function buildHeaders(
  init: RequestInit,
  accessToken: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Merge caller-supplied headers first so we don't accidentally override them
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, init.headers as Record<string, string>);
    }
  }

  // Attach Bearer token when available and not already set by caller
  if (accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // Auto-set Content-Type for requests that carry a body
  if (
    init.body !== undefined &&
    init.body !== null &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * Authenticated fetch wrapper around the Fulcrum REST API.
 *
 * - Automatically attaches `Authorization: Bearer <accessToken>`.
 * - Adds `Content-Type: application/json` when a body is present.
 * - Sends `credentials: 'include'` on every request so the browser
 *   automatically attaches the HttpOnly refresh-token cookie.
 * - On a 401 response it attempts a silent token refresh by POST-ing to
 *   `/auth/refresh` with `credentials: 'include'` — no token in the body;
 *   the browser sends the HttpOnly cookie automatically.
 * - If the refresh succeeds the original request is retried once with the
 *   new access token.
 * - If the refresh itself fails (network error or non-OK status) the
 *   in-memory access token is cleared and `Error('SESSION_EXPIRED')` is
 *   thrown so callers / global error boundaries can redirect to sign-in.
 *
 * @param path  API path relative to the base URL, e.g. `/goals`
 * @param init  Standard `RequestInit` options (method, body, headers, …)
 * @returns     The raw `Response` — callers decide how to parse it
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const accessToken = getAccessToken();
  const headers = buildHeaders(init, accessToken);

  let response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  // Happy path — return immediately
  if (response.status !== 401) {
    return response;
  }

  // -------------------------------------------------------------------------
  // 401 → attempt silent token refresh via HttpOnly cookie.
  // We do NOT send a refresh token in the request body — the browser sends
  // the HttpOnly cookie automatically because of `credentials: 'include'`.
  // -------------------------------------------------------------------------

  let refreshResponse: Response;
  try {
    refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Network-level failure during refresh
    clearAccessToken();
    throw new Error("SESSION_EXPIRED");
  }

  if (!refreshResponse.ok) {
    clearAccessToken();
    throw new Error("SESSION_EXPIRED");
  }

  let envelope: ApiEnvelope<{ accessToken: string }>;
  try {
    envelope = (await refreshResponse.json()) as ApiEnvelope<{
      accessToken: string;
    }>;
  } catch {
    clearAccessToken();
    throw new Error("SESSION_EXPIRED");
  }

  if (!envelope.success || !envelope.data?.accessToken) {
    clearAccessToken();
    throw new Error("SESSION_EXPIRED");
  }

  // Persist the new access token in memory
  setAccessToken(envelope.data.accessToken);

  // Retry the original request with the fresh access token
  const retryHeaders = {
    ...headers,
    Authorization: `Bearer ${envelope.data.accessToken}`,
  };
  response = await fetch(url, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
  });

  return response;
}