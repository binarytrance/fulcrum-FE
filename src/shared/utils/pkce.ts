// PKCE (RFC 7636) utilities
// All crypto uses the Web Crypto API — no external dependencies.

const PKCE_VERIFIER_KEY = 'pkce_code_verifier';

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically random code_verifier (43-128 chars, base64url).
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32); // 32 bytes → 43 base64url chars
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

/**
 * Derives the code_challenge from a code_verifier using S256 (SHA-256).
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlEncode(digest);
}

/**
 * Persists the code_verifier in sessionStorage for retrieval by the callback page.
 * sessionStorage is scoped to the tab and cleared when the tab is closed.
 */
export function saveCodeVerifier(verifier: string): void {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
}

/**
 * Retrieves and removes the stored code_verifier (one-time read).
 * Returns null if none is present (e.g. user navigated directly to callback).
 */
export function consumeCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  return verifier;
}
