export const API_V1_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:6969") + "/api/v1";

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_V1_BASE}${normalizedPath}`;
}

type ApiFetchOptions = {
  retryOnUnauthorized?: boolean;
};

async function apiFetchRaw(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const mergedHeaders = {
    Accept: "application/json",
    ...(init.headers ?? {}),
  };

  return fetch(buildApiUrl(path), {
    ...init,
    headers: mergedHeaders,
    credentials: "include",
  });
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<Response> {
  const { retryOnUnauthorized = true } = options;
  const response = await apiFetchRaw(path, init);

  if (!retryOnUnauthorized || response.status !== 401) {
    return response;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/auth/refresh") {
    return response;
  }

  const refreshResponse = await apiFetchRaw("/auth/refresh", { method: "POST" });
  if (!refreshResponse.ok) {
    return response;
  }

  return apiFetchRaw(path, init);
}

