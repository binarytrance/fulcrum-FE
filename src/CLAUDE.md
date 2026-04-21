# MODULES

---

## Goals

### TODO

#### High
- Goal completion pull: when a goal's progress crosses ~90%, surface a "Ready to complete?" nudge card in Today above the task list.
- Analytics: GoalAnalytics inline on goal detail page / goal card (logged hours, completion trajectory, consistency score) — not a separate navigation tab.

#### Medium
- (none yet)

#### Low
- Remove refreshToken from AuthTokens type in src/types/index.ts — the refresh token is HttpOnly-only and never reaches JS; the type is misleading.

### Under Consideration / Brainstorming
- (none yet)

---

## Habits

### TODO

#### High
- (none yet)

#### Medium
- Analytics: HabitAnalytics inline on habit detail / habits list (streak, completion rate) — not a separate tab.

#### Low
- (none yet)

### Under Consideration / Brainstorming
- (none yet)

---

## Tasks

### TODO

#### High
- Orphan task warning: any task with no goalId gets a subtle "⚠ not linked to a goal" indicator on the task item. Clicking it opens a goal-picker inline.

#### Medium
- Analytics: EstimationProfile surfaced inline on task creation as a predictive hint — not a separate tab.

#### Low
- (none yet)

### Under Consideration / Brainstorming
- (none yet)

---

## Sessions

### TODO

#### High
- (none yet)

#### Medium
- Error state: add setError(null) at the top of handleRevoke and handleRevokeAll in sessions/page.tsx — a previous failure's error banner stays visible after a subsequent successful action.
- Composition: SessionCard JSX (~60 lines) is inlined inside the map in sessions/page.tsx. Extract to components/SessionCard.tsx. The "sign out all" confirmation block is also a natural candidate for components/SignoutAllSection.tsx.
- Analytics: SessionAnalytics inline at top of sessions list (cumulative focus time, weekly bar) — not a separate tab.
- Content/i18n: migrate page title/subtitle, sign-out-all copy, and all error strings in sessions/page.tsx to src/content/sessions.ts.

#### Low
- (none yet)

### Under Consideration / Brainstorming
- (none yet)

---

## Streak

### TODO

#### High
- (module to be defined — cross-reads from Habits, Tasks, and Sessions to compute streaks and consistency scores)

#### Medium
- (none yet)

#### Low
- (none yet)

### Under Consideration / Brainstorming
- (none yet)

---

## Planner

### TODO

#### High
- Goal of the Day spotlight: let users pin one goal as the day's focus. Renders as a large card at the very top of Today with today's relevant tasks nested inside it.
- Weekly goal check-in: on Mondays, Today shows a goal review card — "Last week: N tasks toward [Goal]. This week: N scheduled." Dismissible per-week.
- Remove src/app/(app)/dashboard/page.tsx — a page explicitly called "dashboard" is a meta-page that points at the app rather than being the app. The whole (app) route group IS the dashboard.
- Decide on a landing route for authenticated users and update all router.replace('/dashboard') calls once decided:
    1. /today — proven pattern (Todoist, Linear, Structured). DailyAnalytics + WeeklyAnalytics surface naturally here.
    2. /goals — makes the app's mental model immediately clear.
    3. last-visited — persist last route to localStorage, no artificial home.

#### Medium
- Analytics: DailyAnalytics + WeeklyAnalytics inline on the Today/Planner view (today's focus total, week progress bar) — the Planner view is the only cross-entity analytics surface, not a separate tab.
- Content/i18n: migrate welcome copy, "Coming in the next MR", and feature label array in dashboard/page.tsx to src/content/.

#### Low
- (none yet)

### Under Consideration / Brainstorming
- Goal Context Header: show top 1–3 active HIGH priority goals with mini progress bars above the task list. Each task and habit also shows a goal badge inline. Makes goal-task relationships ambient rather than requiring a separate spotlight interaction.

---

## Identity

### TODO

#### High
- Move sessions button to profile section.
- Providers component calls hydrate() unconditionally on every mount — add an isAuthenticated guard so it skips the /auth/refresh call when a session is already live.

#### Medium
- (none yet)

#### Low
- (none yet)

### Under Consideration / Brainstorming
- (none yet)

---

## Onboarding

### TODO

#### High
- Fix implicit token coupling in OAuth callbacks — callback pages call setUser(user) but the access token is set as a side effect inside completeAuthWithTokens via setAccessToken(). Should call setAuth(user, accessToken) so the store owns the full auth state, not a utility function.

#### Medium
- "Forgot password?" on signin page is a non-interactive span — either remove it or mark it disabled/coming-soon with cursor-not-allowed.
- verify-email page double-wraps the auth layout — the page renders its own flex min-h-screen container AND its own logo inside the (auth) layout group. Move it outside (auth)/ or strip the redundant wrapper.
- Replace setTimeout(1200) redirect after signup with an immediate router.push — the success message is already shown in-place, no need for the delay.
- Composition: signup/page.tsx — EmailSignupForm was a separate component on master and was deleted and inlined (261 lines). Extract back to components/EmailSignupForm.tsx. Page renders OAuth buttons + <EmailSignupForm />, no toggling needed.
- Composition: signin/page.tsx — email/password form is inlined (219 lines). Extract to components/EmailSigninForm.tsx. Page renders OAuth buttons + divider + <EmailSigninForm />.
- Composition: verify-email/page.tsx — VerifyEmailContent inner function exists only due to Suspense requirement, not intentional composition. Extract form, resend handler, and success/error states to a VerifyEmailForm component.
- Composition: four OAuth callback pages are near-identical copies — signin/google, signup/google, signin/github, signup/github differ only in error strings and "try again" href. Extract shared logic to a single OAuthCallbackHandler component that accepts provider label and fallback href as props.
- Content/i18n: migrate (auth)/layout.tsx (PANEL_FEATURES array, all marketing copy — "Build the life", early-access badge, footer), signin/page.tsx, signup/page.tsx, verify-email/page.tsx, and all 4 OAuth callback pages to src/content/auth.ts.

#### Low
- Replace text ✕ error icons in callback pages with <X /> from lucide-react for consistency.

### Under Consideration / Brainstorming
- (none yet)

---

## App / Infrastructure

### TODO

#### High
- Fix hardcoded API_BASE — src/lib/api.ts, src/store/auth-store.ts, and src/utils/complete-auth.ts all hardcode http://localhost:6969/api/v1 instead of using NEXT_PUBLIC_AUTH_API_BASE from env (src/utils/auth.ts already does it correctly).
- Separate component for logo.
- Layout Manager: use a single switching mechanism for the entire app shell — not per-page flag checks scattered across components.
    - structure:
        src/lib/layouts/
          registry.ts           — maps LayoutMode string keys to Layout components
          layout-resolver.ts    — single place that maps all conditions → a LayoutMode
          today-layout.tsx      — sidebar + DailyProgressBar chrome
          goals-layout.tsx      — sidebar + goal hierarchy chrome
          focus-layout.tsx      — no nav, just timer + task (used during active sessions)
          onboarding-layout.tsx — stepped onboarding shell
        src/components/
          layout-manager.tsx    — reads mode prop, looks up Layout from registry, renders with children
    - resolution order in layout-resolver.ts (first match wins):
        1. active focus session → 'focus' (always overrides everything)
        2. onboarding segment → 'onboarding'
        3. PostHog feature flag (set by middleware from userId hash) → 'today' | 'goals'
        4. default fallback
    - AppLayout (Server Component) is the only place that calls resolveLayoutMode() — resolves once at the shell level, never in pages or components.
    - adding a new layout or condition = one entry in registry.ts + one line in layout-resolver.ts. nothing else changes.
    - each Layout in the registry is a dumb shell component — knows nothing about why it was selected.
    - QA override: middleware reads ?layout= query param → sets x-force-layout header → layout-resolver reads it first.

#### Medium
- Feature Flags / A/B Testing: add PostHog (covers feature flags + A/B testing + product analytics + session recording; free up to 1M events/month; has Next.js App Router SDK).
    - flags must be evaluated server-side (Edge Middleware) — variant must be known at render time to avoid flash of wrong variant.
    - assignment must be deterministic per user — hash userId into 0–99 bucket, same user always gets same variant.
    - implementation order:
        1. install PostHog, add to Providers, verify events are flowing
        2. add src/lib/flags.ts — flag definitions, rollout percentages, variant lists
        3. add variant assignment in middleware.ts — read userId cookie → hash → set x-flag-* header + variant cookie
        4. add FlagsContext (Server Component reads headers(), passes to client via context)
        5. first flag: landing route 'today' vs 'goals' (50/50 split, measure 7-day retention per variant)
    - never read flags directly in components — always go through FlagsContext.
- Content / i18n-readiness: introduce src/content/ and src/data/ to eliminate all hardcoded strings and static data from JSX. Designed so migrating to next-intl is a mechanical find-and-replace.
    - src/content/   — UI strings keyed by page/domain (auth.ts, dashboard.ts, sessions.ts)
    - src/data/      — static lists and objects (PANEL_FEATURES, goal categories, etc.)

#### Low
- GoogleIcon SVG is duplicated between GoogleSignupButton.tsx and GoogleSigninButton.tsx — extract to a shared component.
- Toast IDs use Math.random() — replace with crypto.randomUUID() to avoid collisions.

### Under Consideration / Brainstorming
- (none yet)

---

# Architecture Notes

The backend (fulcrum-BE, oauth-redirect branch) is a NestJS app organized in a
clean/hexagonal architecture — three explicit layers: presentation (controllers,
guards, DTOs), application (service use-cases), and domain (entities, port interfaces,
types), with infrastructure adapters plugged in behind the ports. Authentication
covers three providers (LOCAL, GOOGLE, GITHUB) and uses JWT tokens delivered as
HttpOnly cookies.

The frontend (fulcrum-FE, master branch) is a Next.js app. Auth-specific code lives in
src/utils/auth.ts, src/utils/auth-api.ts, src/store/auth-store.ts, and the
src/app/(auth)/ route group.

---

Flow 1 — Local signup (email + password)

Step 1: User fills out the form (EmailSignupForm)

src/app/(auth)/signup/components/EmailSignupForm.tsx validates the form with Zod:
firstname, lastname, email, username, password. The username field has an "AI" button
that calls a server action (generateUsername) to suggest a fun username from the
name+email.

On submit:
POST /auth/signup { email, password, firstname, lastname, username }
via authApiFetch, which is just fetch with credentials: 'include' so cookies travel
automatically.

Step 2: Backend creates a pending credential (not a real user yet)

SignupService.create() (src/modules/auth/application/services/signup.service.ts):

1. Hashes the password with bcrypt (10 salt rounds, via BcryptHasher).
2. Generates a 6-char hex token using crypto.randomBytes(3).toString('hex') — e.g.
   "a3f9c2".
3. Sets an expiry 15 minutes from now.
4. Saves a PendingCredential document to MongoDB — this is not a User record yet.
5. Publishes a SignupEmailEvent — a Bull queue worker picks this up and sends a
   verification email to the user.

The response is just "Signup successful. Please check your email." — no tokens yet.

Why the "pending" pattern? It prevents half-verified users from cluttering the Users
collection. The account doesn't exist until the email is confirmed.

---

Flow 2 — Email verification (completing signup)

Step 1: User submits the token

POST /auth/verify-email { email, token }

Step 2: VerifyEmailService.execute() does everything atomically

src/modules/auth/application/services/verify-email.service.ts:

1. Looks up the PendingCredential by email.
2. Calls pending.isTokenExpired() — the domain entity encapsulates this check (new
   Date() > this._tokenExpiresAt).
3. Compares the submitted token against the stored one.
4. Checks that this email isn't already verified (no existing Auth record with
   provider=LOCAL).
5. Inside a MongoDB transaction (txManager.withTransaction):
    - Creates the real User record.
    - Creates an Auth record: { provider: 'LOCAL', providerId: null, hashedPassword, userId }.
    - Deletes the PendingCredential.
6. Calls tokenService.generateTokens(userId, email) and returns the tokens.

The controller then calls setAuthCookies(res, tokens, configService) — this sets two
HttpOnly cookies:

- accessToken — 15-minute JWT
- refreshToken — 7-day JWT

The Auth entity (src/modules/auth/domain/entities/auth.entity.ts) is a simple
immutable value object — all fields set in the constructor, all accessible only via
getters. The domain layer can't accidentally mutate it.

---

Flow 3 — Local signin

POST /auth/signin { email, password }

LocalSigninService.execute()
(src/modules/auth/application/services/local-signin.service.ts):

1. Finds the User by email.
2. Finds the Auth record by userId.
3. passwordHasher.comparePassword(submitted, auth.hashedPassword) — bcrypt compare.
4. Generates and returns tokens. The controller sets cookies.

All failures return a generic "Invalid credentials" — deliberately vague to avoid
enumerating whether the email exists.

---

Flow 4 — Google OAuth (the most complex)

This is the central design of the oauth-redirect branch. The challenge: the FE needs
to tell the backend "after Google redirects you, send the user back to this FE URL" —
but Google's callback URL must be a single pre-registered URL. The solution is the
state parameter as a signed, expiring redirect token.

Step 1: FE redirects the browser to the backend

GoogleSignupButton / GoogleSigninButton both call:

const authStartUrl = buildOAuthStartUrl('/google', GOOGLE_SIGNUP_CALLBACK_PATH);
window.location.assign(authStartUrl);

buildOAuthStartUrl (src/utils/auth.ts) produces:
http://localhost:6969/api/v1/auth/google
?redirect_uri=http://localhost:3000/signup/google/callback

The redirect_uri tells the backend where to send the user back after the whole OAuth
dance.

Step 2: Backend creates a signed state token

GET /auth/google?redirect_uri=... hits AuthController.googleLogin():

1. Validates redirect_uri is present.
2. Calls googleOauthRedirectService.createGoogleConsentUrl(redirectUri).

GoogleOAuthRedirectService (application/services/google-oauth-redirect.service.ts):

- Validates the redirect_uri origin against a config allowlist (prevents open-redirect
  attacks).
- Calls oauthStateService.create(validatedRedirectUri).

OauthStateService.create() (application/services/oauth-state.service.ts):
const payload = { redirectUri, exp: now + 600, nonce: randomBytes(16).toString('hex') };
const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
const signature = HMAC-SHA256(payloadEncoded, oauthStateSecret);
return `${payloadEncoded}.${signature}`;
This is essentially a mini hand-rolled signed JWT specifically for the OAuth state.
The nonce prevents reuse.

Then GoogleOAuthRedirectService manually builds the Google consent URL:
https://accounts.google.com/o/oauth2/v2/auth
?client_id=...
&redirect_uri=http://localhost:6969/api/v1/auth/google/callback (the fixed BE URL)
&response_type=code
&scope=openid email profile
&state={signed-payload}.{signature}
The controller redirects (302) the browser to this URL.

Step 3: User approves on Google

Google redirects back to the fixed backend callback URL:
GET /auth/google/callback?code=...&state={signed-state}

Step 4: Passport exchanges the code for a profile

GoogleAuthGuard triggers GoogleStrategy (Passport's passport-google-oauth20). The
strategy:

1. Exchanges the code for an OAuth access token with Google.
2. Fetches the user's Google profile.
3. Calls validate(), which maps it to an OAuthProfile:
   { provider: 'GOOGLE', providerId: profile.id, email, firstname, lastname }
   This is attached to req.user.

Step 5: Controller resolves the redirect and signs in the user

AuthController.googleCallback():

1. Extracts state from query params.
2. Calls googleOauthRedirectService.resolveRedirectUriFromState(state):
    - Splits the state into payload + signature, verifies the HMAC with timingSafeEqual
      (constant-time comparison to prevent timing attacks).
    - Checks the exp field.
    - Extracts and validates the redirectUri.
3. Calls oAuthSigninService.execute(req.user as OAuthProfile).

OAuthSigninService.execute() (application/services/oauth-signin.service.ts):

- Tries to find an existing Auth record by (provider=GOOGLE, providerId).
- If none: runs a transaction to find-or-create the user:
    - Checks if a User already exists with this email (account merging — if you signed
      up with local auth first, the Google auth record just gets attached to the same user).
    - If no user, creates a new one.
    - Creates the Auth record: { provider: 'GOOGLE', providerId: googleId, hashedPassword: null }.
- Finds the user, generates tokens.

4. Controller calls setAuthCookies(res, tokens, configService) to set the cookies.
5. Redirects the browser to:
    - Success: http://localhost:3000/signup/google/callback?status=success
    - Error: http://localhost:3000/signup/google/callback?status=error&message=...

Step 6: FE callback page finalizes the session

/signup/google/callback page (src/app/(auth)/signup/google/callback/page.tsx) runs on
mount:

1. Reads ?status from the URL.
2. If error → shows the message, links back to /signup.
3. If success → calls GET /auth/me with credentials: 'include' (the cookies are
   already set from the BE redirect).
4. On success, calls useAuthStore.setUser(payload.data) to hydrate the in-memory
   Zustand store.
5. router.replace('/goals').

GET /auth/me (AuthController.me()) manually reads the accessToken cookie, verifies it,
and returns { userId, email, authenticated: true } — no guard needed, it does
verification inline.

Signup vs Signin are the same backend flow — OAuthSigninService finds-or-creates
regardless. The only difference between /signup/google/callback and
/signin/google/callback on the frontend is where "try again" links point.

---

Flow 5 — JWT token lifecycle

Tokens

JwtTokenAdapter (infrastructure/security/jwt-token.adapter.ts):

- Access token: signed with jwtAccessSecret, expires in 15 minutes.
- Refresh token: signed with jwtRefreshSecret, expires in 7 days.
- After generating a refresh token, it's bcrypt-hashed and stored in Redis at key
  refresh:{userId}.

Why store the refresh token in Redis?

Because JWTs are stateless by nature — once issued, they're valid until expiry.
Storing a hash in Redis lets you revoke a refresh token (by deleting the key) even
before it expires. This is what POST /auth/signout does. It's a server-side session
for the long-lived token.

How cookies work

setAuthCookies() (presentation/utils/auth-cookie.util.ts) sets both tokens with:

- httpOnly: true — JavaScript can't read them (XSS protection).
- secure: true in production — only sent over HTTPS.
- sameSite: 'lax' — sent on top-level navigations (needed for the OAuth redirect to
  carry the cookies back), but not on cross-site sub-requests (CSRF protection).
- path: '/' — available to all routes.

Strategies (how tokens are validated per request)

JwtAccessStrategy (infrastructure/strategies/jwt-access.strategy.ts):

- Extracts the token from the Authorization: Bearer header or the accessToken cookie.
- Verifies the JWT signature, passes the decoded { sub, email } payload to req.user.

JwtRefreshStrategy (infrastructure/strategies/jwt-refresh.strategy.ts):

- Same extraction (header or refreshToken cookie).
- Additionally calls tokenService.isRefreshTokenValid(userId, rawToken) —
  bcrypt-compares the raw token against the Redis hash. This guards against stolen
  tokens after signout.

Refresh

POST /auth/refresh is protected by JwtRefreshGuard (which runs JwtRefreshStrategy). If
valid, it generates a new pair of tokens and sets new cookies — the old refresh token
is implicitly replaced in Redis.

---

Flow 6 — Signout

POST /auth/signout (requires JwtAuthGuard):

1. Gets req.user.sub (userId from the access token in the cookie).
2. tokenService.revokeRefreshToken(userId) — deletes refresh:{userId} from Redis.
3. clearAuthCookies(res, configService) — sets both cookies with maxAge: 0, which
   tells the browser to delete them.

There's also a simpler POST /auth/logout that needs no guard — it just tries to clear
cookies and optionally revokes if a valid refresh token is present.

---

Data model summary

┌──────────────────────┬──────────────────────────────────────────────────────────┐
│ Collection           │ Purpose                                                  │
├──────────────────────┼──────────────────────────────────────────────────────────┤
│ users                │ Core user identity (name, email, etc.)                   │
├──────────────────────┼──────────────────────────────────────────────────────────┤
│ auth                 │ One record per (userId × provider) — holds hashed        │
│                      │ password for LOCAL, providerId for OAuth                 │
├──────────────────────┼──────────────────────────────────────────────────────────┤
│ pending_credentials  │ Temporary signup staging — deleted once email is         │
│                      │ verified                                                 │
├──────────────────────┼──────────────────────────────────────────────────────────┤
│ Redis                │ Bcrypt hash of the current refresh token                 │
│ refresh:{userId}     │                                                          │
└──────────────────────┴──────────────────────────────────────────────────────────┘

The separation of users and auth is intentional. A single user can have multiple auth
records — one for LOCAL, one for GOOGLE, one for GITHUB. The email-merging logic in
OAuthSigninService links them all to the same userId.

---

Key security decisions worth noting

1. Open-redirect prevention: redirect_uri is validated against a config allowlist
   before being encoded in the state. You can't craft a state that sends tokens to an
   attacker-controlled domain.
2. CSRF on state: The state token is HMAC-signed with a server secret, has a nonce and
   a 10-minute expiry. Forging or replaying it isn't possible without the secret.
3. Timing-safe comparison: timingSafeEqual is used when verifying the state signature
   — prevents timing-based signature oracle attacks.
4. Refresh token rotation: The refresh token is stored as a bcrypt hash. Even if
   someone reads Redis, they can't use the hash directly. Revocation is instant via key
   deletion.
5. Generic error messages: Local signin always returns "Invalid credentials"
   regardless of whether the email or password was wrong — prevents email enumeration.
