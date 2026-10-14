import { setAccessToken, API_V1_BASE as API_BASE } from "@/lib/api";
import type { AuthUser } from "@/types";

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
 * Exchanges a one-time OAuth code + PKCE code_verifier for an access token.
 * The backend verifies PKCE, returns the access token in the response body,
 * and sets the refresh token as an HttpOnly cookie.
 */
export async function exchangeOAuthCode(
  code: string,
  codeVerifier: string,
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/oauth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include', // so the backend can set the refresh cookie
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });

  let payload: { success: boolean; message: string; data?: { accessToken: string } };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new Error('Unexpected response from server during token exchange.');
  }

  if (!response.ok || !payload.success || !payload.data?.accessToken) {
    throw new Error(
      payload.message || 'Token exchange failed. Please sign in again.',
    );
  }

  return completeAuthWithTokens(payload.data.accessToken);
}

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