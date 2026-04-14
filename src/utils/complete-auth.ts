import { setAccessToken } from "@/lib/api";
import type { AuthUser } from "@/types";

const API_BASE = "http://localhost:6969/api/v1";

type MeApiResponse = {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    firstname: string;
    lastname: string | null;
  };
};

/**
 * Given a fresh access token (the backend manages the refresh token via
 * an HttpOnly cookie — we never touch it on the frontend):
 *  1. Stores the access token in memory via setAccessToken.
 *  2. Calls GET /auth/me with the access token.
 *  3. Returns the user profile.
 *
 * Throws an Error with a human-readable message on any failure.
 */
export async function completeAuthWithTokens(
  accessToken: string,
): Promise<AuthUser> {
  // Store the access token in memory so subsequent apiFetch calls include it.
  setAccessToken(accessToken);

  const response = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let payload: MeApiResponse;
  try {
    payload = (await response.json()) as MeApiResponse;
  } catch {
    throw new Error("Unexpected response from server while fetching profile.");
  }

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(
      payload.message || "Could not load your profile. Please sign in again.",
    );
  }

  const { id, email, firstname, lastname } = payload.data;

  return {
    id,
    email,
    firstname,
    lastname: lastname ?? "",
  } satisfies AuthUser;
}