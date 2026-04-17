import { apiFetch, parseApiError, unwrapApiResponse } from "@/lib/api";
import type { AuthSession } from "@/types";

/**
 * Fetch all active sessions for the current user.
 * Requires a valid access token (Bearer header is attached automatically by apiFetch).
 */
export async function listSessions(): Promise<AuthSession[]> {
  const response = await apiFetch("/auth/sessions");
  const data = await unwrapApiResponse<{ sessions: AuthSession[] }>(response);
  return data.sessions;
}

/**
 * Revoke a specific session by its ID.
 * If the revoked session is the current one the backend also clears the refresh cookie.
 */
export async function revokeSession(sessionId: string): Promise<void> {
  const response = await apiFetch(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await parseApiError(response);
  }
}

/**
 * Revoke ALL sessions (sign out all devices).
 * Uses the access token — does not need the refresh cookie.
 */
export async function revokeAllSessions(): Promise<void> {
  const response = await apiFetch("/auth/signout-all", { method: "POST" });
  if (!response.ok) {
    await parseApiError(response);
  }
}
