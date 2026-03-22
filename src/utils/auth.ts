export const AUTH_API_BASE =
    process.env.NEXT_PUBLIC_AUTH_API_BASE ?? 'http://localhost:6969/api/v1/auth';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL;

export const GOOGLE_SIGNUP_CALLBACK_PATH = '/signup/google/callback';
export const GOOGLE_SIGNIN_CALLBACK_PATH = '/signin/google/callback';

export function buildAuthApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${AUTH_API_BASE}${normalizedPath}`;
}

export function buildAppUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : (APP_BASE_URL ?? '');

    return `${origin}${normalizedPath}`;
}

export function buildOAuthStartUrl(provider: string, redirectPath: string): string {
    const url = new URL(buildAuthApiUrl(provider));
    url.searchParams.set('redirect_uri', buildAppUrl(redirectPath));
    return url.toString();
}
