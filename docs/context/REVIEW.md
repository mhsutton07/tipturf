# Code Review
**Date:** 2026-02-21
**Scope:** Full codebase security and MVP production readiness audit — all files under `src/`, `.env.example`, `next.config.js`

## Verdict: APPROVE WITH CONDITIONS

Three P1 issues must be fixed before going live. No P0 blockers were found — the critical payment path (webhook signature verification, service-role isolation, server-side subscription enforcement) is structurally sound. The P1s are fixable in under an hour.

---

## Critical (P0)
_None identified._

---

## Important (P1)

- **`src/app/api/logs/route.ts:94-131` — POST /api/logs accepts unauthenticated writes.**
  The GET handler correctly enforces Pro auth. The POST handler validates the schema and snaps coordinates server-side, but there is no `auth.getUser()` check. Any anonymous actor can freely pollute the `tip_logs` table with fabricated data at zero cost, poisoning the community heatmap permanently. Fix: add the same user + `isSubscribed` guard block that the GET handler uses (or at minimum require a valid Supabase session) before the `supabase.from('tip_logs').insert(...)` call.

- **`src/lib/subscription.ts:13` — `NEXT_PUBLIC_BYPASS_PAYWALL` is a global server-side bypass with no environment guard.**
  Because the variable is prefixed `NEXT_PUBLIC_`, it is embedded in the client bundle at build time AND evaluated on the server. If this variable is accidentally set to `'true'` in a Vercel Production environment (e.g., via a copy-paste of a `.env.local` block), every user — authenticated or not — receives `isPro: true` from `isSubscribed()`. The bypass is used in both `src/lib/subscription.ts` (server) and `src/hooks/useSubscription.ts` (client). There is no `process.env.NODE_ENV === 'development'` guard. Fix: add `&& process.env.NODE_ENV !== 'production'` to both bypass conditions, so a mis-set prod env var cannot activate it.

- **`src/app/api/checkout/route.ts:18` and `src/app/api/portal/route.ts:33` — `origin` header is user-controlled and used in redirect URLs.**
  `request.headers.get('origin')` can be spoofed by a server-side request (e.g., a crafted `curl`). A malicious actor could set `Origin: https://evil.com` and receive a Stripe checkout session whose `success_url` and `cancel_url` point to an attacker-controlled domain. Stripe does validate `success_url` against the dashboard's allowlist only if that feature is enabled — which is off by default. Fix: define an allowlist of valid origins in an env var (e.g., `NEXT_PUBLIC_APP_URL`) and use that value directly; do not reflect the incoming `origin` header.

---

## Suggestions (P2)

- **`src/lib/supabase/server.ts:12` — `createServerClient` uses the anon key on the server.**
  Route handlers that run server-side should use cookie-based session propagation (via `@supabase/ssr`) rather than a plain `createClient` with the anon key. The current approach means the JWT is never forwarded from the browser session, so `supabase.auth.getUser()` in route handlers relies on the request's Authorization header being set by the client. If it is not, `getUser()` silently returns `null` — this is consistent with the current behavior, but it means there is no defense-in-depth if a misconfigured client forgets to attach the header. Evaluate migrating to `@supabase/ssr` `createServerClient` with cookie handling before Phase 2 traffic scales.

- **`src/app/api/logs/route.ts:66-68` — Supabase error message surfaced to client.**
  `NextResponse.json({ error: error.message }, { status: 500 })` reflects raw Postgres/PostgREST error strings to the caller. These can include table names, column names, and constraint details. Replace with a generic `'Internal server error'` and log the real error server-side.

- **`src/lib/supabase/admin.ts` — No `'server-only'` import guard.**
  The comment says "NEVER import this file in any client component," but there is no enforcement. Adding `import 'server-only';` as the first line would cause a build-time error if the file is ever accidentally imported in a `'use client'` tree, preventing a service-role key leak to the browser bundle.

- **`src/app/api/logs/route.ts:40-48` — No bounding-box size limit.**
  A caller can pass `minLat=-90, maxLat=90, minLng=-180, maxLng=180` and retrieve the entire `tip_logs` table in one request. The Supabase default row limit (1000) provides soft protection, but an explicit cap on the viewport size (e.g., ±1 degree in each axis) should be enforced server-side to prevent scraping and excessive DB load.

- **`src/app/api/webhooks/stripe/route.ts:36-38` — `checkout.session.completed` upserts on email, not Supabase user ID.**
  The upsert key is `email`. If a user changes their email in Supabase Auth between checkout initiation and the webhook arriving, a new row is created rather than updating the correct one. The session's `client_reference_id` should be set to the Supabase user ID at checkout creation time, and the webhook should upsert on `id` instead.

- **`next.config.js` — No `Content-Security-Policy` or security headers configured.**
  This is a PWA handling payment flows. At minimum, add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a `Referrer-Policy` via `headers()` in `next.config.js` before production deployment.

- **`.env.example:14` — Example file ships `NEXT_PUBLIC_BYPASS_PAYWALL=true` as the default value.**
  A developer cloning the repo and running `cp .env.example .env.local` gets paywall bypass active by default. This is understandable for dev onboarding but increases the chance of a live deployment inheriting the bypass. Consider defaulting to `false` and adding a comment instructing developers to flip it manually.

---

## What's Good

- Webhook signature verification is correctly implemented using `stripe.webhooks.constructEvent` over the raw buffer — the most common webhook security mistake (verifying over the parsed body) is avoided.
- `supabaseAdmin` (service-role) is cleanly isolated to the webhook handler only. No route that serves user requests imports it.
- `isSubscribed()` is the single source of truth for paywall checks — no scattered inline `stripe_status === 'active'` comparisons that could drift.
- Input validation via Zod in `TipLogInputSchema` is thorough: coordinate bounds, enum constraints, date format, and a PII filter on notes (address and name patterns).
- Server-side coordinate snapping in `snapCoord()` prevents clients from submitting arbitrary precision coordinates to fingerprint individual deliveries.
- `DEV_BYPASS_EMAILS` is evaluated at module load from a server-only env var (no `NEXT_PUBLIC_` prefix), so it is never embedded in the client bundle.
- `ProGate` correctly renders blurred content behind the paywall rather than conditionally omitting it — the server-enforced API is the real gate; the UI blur is UX only, and the code treats it that way.
- Phase 2 stubs (`sync.ts`, `useAuth.ts`) throw clearly rather than silently no-op, which will surface integration gaps immediately during Phase 2 development.

---

## Action Items

1. **[P1] Add auth + Pro guard to `POST /api/logs`** — unauthenticated writes to `tip_logs` are a data integrity risk that will corrupt the product's core value proposition.
2. **[P1] Gate both bypass paths (`NEXT_PUBLIC_BYPASS_PAYWALL` in `subscription.ts` and `useSubscription.ts`) behind `NODE_ENV !== 'production'`** — accidental prod activation would give all users free Pro access.
3. **[P1] Replace reflected `origin` header in `/api/checkout` and `/api/portal`** with a hardcoded `NEXT_PUBLIC_APP_URL` env var for Stripe redirect URLs.
4. **[P2] Add `import 'server-only'` to `src/lib/supabase/admin.ts`** — build-time enforcement is safer than a comment.
5. **[P2] Cap bounding-box query size in `GET /api/logs`** — prevents full-table scraping via a single API call.
6. **[P2] Replace raw Supabase error strings surfaced to the client in `GET /api/logs:67`** with a generic 500 message.
7. **[P2] Add security headers to `next.config.js`** — CSP, X-Frame-Options, X-Content-Type-Options before first public deployment.
8. **[P2] Switch `checkout.session.completed` webhook upsert key from `email` to Supabase user ID** by passing `client_reference_id` at session creation.
