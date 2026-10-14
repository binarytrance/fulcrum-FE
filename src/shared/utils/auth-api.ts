import { buildAuthApiUrl } from "@/utils/auth";

export async function authApiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const mergedHeaders = {
    Accept: "application/json",
    ...(init.headers ?? {}),
  };

  return fetch(buildAuthApiUrl(path), {
    ...init,
    headers: mergedHeaders,
    credentials: "include",
  });
}
