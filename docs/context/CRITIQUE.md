# Critique
**Date:** 2026-02-21
**Target:** TipTurf — Security and MVP Production Readiness
**Score:** 5.5/10

---

## Verdict
A structurally solid payment core dragged down by an open write endpoint that will destroy your product's only moat on day one and a paywall bypass that one mis-pasted env var will hand to every user on the internet.

---

## P0 — Deploy Blockers

**`POST /api/logs` — Unauthenticated writes accepted.**
This is a deploy blocker the REVIEW mislabels P1. The heatmap IS the product. The tip density data is the entire value proposition. With zero authentication on the write path, any script kiddie can poison every geographic cell with fake data in an afternoon. A corrupted heatmap means your Pro subscribers paid for garbage. The damage is permanent and silent — users will churn before you notice. The fix is four lines. There is no world where you ship this open.

Fix: Add `auth.getUser()` + `isSubscribed()` guard to `POST /api/logs` before the insert, identical to the GET handler pattern already in the same file.

**`NEXT_PUBLIC_BYPASS_PAYWALL` — No production guard.**
This is also a deploy blocker, not a P1. A variable prefixed `NEXT_PUBLIC_` is baked into the client bundle at build time. It is evaluated server-side AND exposed in the browser. One accidental copy-paste of a `.env.local` block into Vercel's production environment settings — a mistake made constantly by solo developers — gives every anonymous visitor `isPro: true`. Your entire revenue model collapses silently with no error, no log, no alert. The `.env.example` ships `NEXT_PUBLIC_BYPASS_PAYWALL=true` as the default, making this failure mode the path of least resistance.

Fix: Wrap both bypass conditions in `process.env.NODE_ENV !== 'production'`. Change `.env.example` default to `false`.

---

## P1 — Must Fix Before Launch

**Reflected `origin` header in `/api/checkout` and `/api/portal`.**
User-controlled `Origin` header is used to construct Stripe `success_url` and `cancel_url`. Stripe's redirect allowlist is off by default. A crafted server-side request sets `Origin: https://evil.com` and receives a legitimate Stripe checkout session that sends the user to an attacker domain after payment. Real attack surface, not theoretical.

Fix: Replace `request.headers.get('origin')` with a hardcoded `process.env.NEXT_PUBLIC_APP_URL` in both route handlers.

**No security headers on a PWA handling payment flows.**
No `X-Frame-Options`, no `Content-Security-Policy`, no `X-Content-Type-Options`. This is a PWA that processes payments and is Vercel-deployed. Clickjacking is trivially possible. This is a one-time addition to `next.config.js`.

Fix: Add `headers()` block to `next.config.js` with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP at minimum restricting `frame-ancestors`.

---

## P2 — Fix Within 30 Days

**Supabase error strings surfaced to client in `GET /api/logs:67`.**
Raw PostgREST errors leak table names, column names, and constraint details. Replace with `'Internal server error'` and log server-side.

**No bounding-box size cap on `GET /api/logs`.**
`minLat=-90, maxLat=90` retrieves the full table in one call. Supabase's 1000-row default is soft protection only. Cap the viewport to a sane geographic radius server-side.

**`admin.ts` has no `'server-only'` import guard.**
A comment saying "never import this client-side" is not enforcement. One accidental import in a `use client` tree leaks your service-role key into the browser bundle. `import 'server-only'` is a one-liner that makes this a build error.

**Webhook upserts on email, not user ID.**
If a user changes their Supabase Auth email between checkout and webhook delivery, a duplicate row is created and the subscription is orphaned. Set `client_reference_id` to the Supabase user ID at session creation and upsert on `id`.

---

## P3 — Backlog

**`createServerClient` uses anon key on server.**
No defense-in-depth if a misconfigured client omits the Authorization header — `getUser()` silently returns null. Migrate to `@supabase/ssr` with cookie-based session propagation before Phase 2 scales.

**VAULT.md is stale.**
It states "No monetization implemented yet" and Phase 2 is "stubbed." The codebase has live Stripe checkout, portal, and webhook routes. Stale documentation is an ops and onboarding hazard. Update VAULT.md to reflect reality.

---

## What's Actually Good

- Webhook signature verification uses raw buffer — the most common webhook security mistake is correctly avoided.
- `supabaseAdmin` (service-role key) is isolated to the webhook handler only. Clean.
- `isSubscribed()` is a single source of truth. No scattered inline status checks that drift.
- Zod validation in `TipLogInputSchema` is thorough: coordinate bounds, enums, date format, PII filter on notes. This is the right approach.
- Server-side coordinate snapping in `snapCoord()` prevents clients from fingerprinting individual deliveries. Thoughtful privacy design.
- `DEV_BYPASS_EMAILS` uses a non-`NEXT_PUBLIC_` env var — correctly server-only, never in the browser bundle.
- `ProGate` blurs rather than conditionally omits — the team understands the real gate is the API, not the UI.
- Phase 2 stubs throw rather than silently no-op. Integration failures will be loud.

---

## Go / No-Go

**NO-GO.**

Two issues have been mislabeled P1 that are P0. `POST /api/logs` being open to anonymous writes corrupts your core product data permanently. `NEXT_PUBLIC_BYPASS_PAYWALL` with no production guard and a `true` default in `.env.example` is one deploy mistake away from giving everyone free access forever. Both are fixable in under an hour. Fix them, verify in a staging environment, then re-evaluate. Everything else is noise until these two are closed.

**Fix First:** Add auth guard to `POST /api/logs`.
**Fix Second:** Gate `NEXT_PUBLIC_BYPASS_PAYWALL` behind `NODE_ENV !== 'production'` and flip `.env.example` default to `false`.
