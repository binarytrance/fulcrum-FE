export const API_V1_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:6969") + "/api/v1";

const API_BASE = API_V1_BASE;

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

// ---------------------------------------------------------------------------
// NestJS response envelope -- every endpoint returns this shape
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
// In-memory access token -- never touches localStorage or sessionStorage.
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
// Token refresh -- singleton promise lock prevents concurrent refresh races.
// If 3 API calls all hit 401 at the same moment, only ONE refresh fires;
// the other two await the same promise and get the new token for free.
// ---------------------------------------------------------------------------

let _refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then(async (res) => {
      if (!res.ok) {
        clearAccessToken();
        return null;
      }
      const envelope = (await res.json()) as ApiEnvelope<{
        accessToken: string;
      }>;
      if (!envelope.success || !envelope.data?.accessToken) {
        clearAccessToken();
        return null;
      }
      setAccessToken(envelope.data.accessToken);
      return envelope.data.accessToken;
    })
    .catch(() => {
      clearAccessToken();
      return null;
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

// ---------------------------------------------------------------------------
// Error parsing helper -- exported so API modules can reuse it
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
    // Response body is not JSON -- keep the default message
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

  // Merge caller-supplied headers first so we do not accidentally override them
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
 * - Sends `credentials: include` on every request so the browser
 *   automatically attaches the HttpOnly refresh-token cookie.
 * - On a 401 response it attempts a silent token refresh via
 *   `refreshAccessToken()`, which is locked so concurrent 401s share
 *   one refresh call.
 * - If the refresh succeeds the original request is retried once with the
 *   new access token, transparently to the caller.
 * - If the refresh fails it means both tokens are expired/revoked and the
 *   user has no valid session. In that case:
 *   1. A `session-expired` DOM event is dispatched — AppShell listens for
 *      this and calls clearAuth() + router.replace('/signin').
 *   2. This function's promise intentionally hangs forever (never resolves
 *      or rejects), so the caller stays in its current loading state rather
 *      than flashing an error. AppShell's navigation unmounts the caller
 *      within ~100ms, at which point the promise and its closure are GC'd.
 *   Callers do not need to handle this case — no SESSION_EXPIRED error will
 *   ever reach a catch block.
 *
 * @param path  API path relative to the base URL, e.g. `/goals`
 * @param init  Standard `RequestInit` options (method, body, headers, ...)
 * @returns     The raw `Response` -- callers decide how to parse it
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

  // Happy path -- return immediately
  if (response.status !== 401) {
    return response;
  }

  // -------------------------------------------------------------------------
  // 401 -> attempt silent token refresh via HttpOnly cookie.
  // refreshAccessToken() is locked -- concurrent 401s share one refresh call.
  // -------------------------------------------------------------------------

  const newToken = await refreshAccessToken();

  if (!newToken) {
    window.dispatchEvent(new CustomEvent("session-expired"));
    await new Promise(() => {}); // hang until AppShell redirects and unmounts the caller
    throw new Error("SESSION_EXPIRED"); // unreachable — satisfies TypeScript
  }

  // Retry the original request with the fresh access token
  const retryHeaders = {
    ...headers,
    Authorization: `Bearer ${newToken}`,
  };
  response = await fetch(url, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
  });

  return response;
}
