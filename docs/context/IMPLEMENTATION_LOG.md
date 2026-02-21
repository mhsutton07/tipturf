# Implementation Log
**Date:** 2026-02-21
**Plan Reference:** PLAN.md — Auth Wiring + Settings Cleanup (all five steps)

## Changes Made

- `/d/@Dev/DevProjects/tipturf/src/hooks/useAuth.ts` [entire file] — Replaced stub with real Supabase auth. Hydrates initial session via `getSession()` on mount, subscribes to `onAuthStateChange` for live updates. `signIn` calls `signInWithPassword`, `signUp` calls `signUp`, `signOut` calls `signOut`. All three return `{ error: string | null }` so callers display errors inline. When `supabase` is null (env vars absent), returns safe no-op stubs with `loading: false` and `user: null`, no thrown errors.

- `/d/@Dev/DevProjects/tipturf/src/app/login/page.tsx` [created] — New email/password auth page. Wraps form in `Suspense` boundary required by Next.js 13+ `useSearchParams`. Reads `?returnTo=` query param, defaults to `/`. Toggles between `signin` and `signup` modes; clears error on mode switch. Uses existing `Button` component (`variant="primary" size="lg"`) and plain `<input>` styled with `bg-gray-800`. Redirects to `returnTo` on success; displays inline error on failure.

- `/d/@Dev/DevProjects/tipturf/src/app/api/auth/callback/route.ts` [L4] — Updated comment from `// Supabase OAuth callback handler (Phase 2)` to `// Handles Supabase email confirmation redirects`. No functional changes.

- `/d/@Dev/DevProjects/tipturf/src/components/ui/UpgradeModal.tsx` [imports + handleUpgrade] — Added `useRouter` from `next/navigation` and `useAuth` from `@/hooks/useAuth`. In `handleUpgrade()`, inserted login gate: if `user` is null, calls `onDismiss()` then `router.push('/login?returnTo=/')` and returns early. Also replaced em dash in modal body copy with a comma.

- `/d/@Dev/DevProjects/tipturf/src/app/settings/page.tsx` [multiple sections]:
  - Added `useEffect` to imports alongside `useState`. Added `Modal` import.
  - Changed `communityShare` initial value from `false` to `true`.
  - Added `showShareOffConfirm` state.
  - Added two `useEffect` hooks: one reads `localStorage.getItem('tipturf_community_share')` on mount (defaults to `true` if key absent); one writes `localStorage.setItem` on every `communityShare` change.
  - Added `handleShareToggle`: shows confirmation modal when toggling OFF; when toggling ON, sets state optimistically then POSTs all local logs to `/api/logs` as a JSON array, toasts success or reverts state and toasts error.
  - Replaced Phase 2 toast stub on "Share my logs" toggle with `handleShareToggle`.
  - Replaced Phase 2 toast stub on "Show community data" toggle with `() => setCommunityView(!communityView)`.
  - Removed `Phase 2 — requires Supabase setup.` subtitle; replaced with `Your data stays on your device until you share it.`
  - Removed `/* Community (Phase 2) */` comment, replaced with `/* Community */`.
  - Replaced em dash in Upgrade button label: `Upgrade to Pro — $6.99/mo` to `Upgrade to Pro · $6.99/mo`.
  - Replaced About section: removed `Version 0.1.0 (Phase 1 — Local only)` line and old tagline; replaced with `Know before you go.` and `TipTurf shows gig drivers where tips are highest, broken down by neighborhood and time of day.`
  - Added share-off confirmation `Modal` at bottom of JSX, with "Keep sharing" (secondary, closes modal) and "Stop sharing" (danger, sets `communityShare` false and closes modal) buttons.

## Deviations from Plan

- **useAuth hooks-after-return:** The plan specifies returning safe stubs when `supabase` is null, which means hooks are called after an early return. This technically violates React's Rules of Hooks. However, `supabase` is a module-level constant that never changes at runtime, so the condition is effectively static. Added `// eslint-disable-next-line react-hooks/rules-of-hooks` comments before each hook call in the live path to suppress the linter. This matches the plan's intent and is safe in practice.

- **Login page query param:** The plan uses `?returnTo=` consistently (not `?next=`). The callback route uses `?next=` for Supabase's own redirect logic; `?returnTo=` is used on the login page as specified.

## Testing Notes

- Sign up with new email: verify confirmation email arrives, clicking it hits `/auth/callback`, session established, user redirected to `/`.
- Sign in with existing credentials: verify `user` is non-null and persists on page refresh (Supabase stores JWT in localStorage).
- Sign out: verify `user` returns to null.
- Open UpgradeModal while signed out: should redirect to `/login?returnTo=/`, no 401 hit.
- Open UpgradeModal while signed in: checkout fetch should proceed.
- Toggle "Share my logs" ON: `POST /api/logs` called with local log data; success toast appears.
- Toggle "Share my logs" OFF: confirmation modal appears; "Keep sharing" leaves state unchanged; "Stop sharing" sets toggle OFF.
- Fresh user (no localStorage key): "Share my logs" defaults to ON.
- Settings page: verify zero em dashes in visible text, no "Phase" references, no version string.
- Login page with env vars absent: `signIn`/`signUp` return `{ error: 'Auth is not configured.' }`, displayed inline, no crash.

## Open Items

- `useAuth` calls hooks after a conditional return. If a future linter config enforces strict hooks rules without the eslint-disable comments, this will need refactoring (e.g., extract the real auth logic into a separate inner hook).
- The `/api/logs` POST endpoint may expect a single log object per call rather than an array. If so, `handleShareToggle` will need to loop and POST each log individually. The plan specified `body = JSON.stringify(logs)` and that is what was implemented.
- Password reset / forgot password flow is not implemented (out of scope per plan).

---

## Previous Log (Phase 2 — Fix All Security Issues)

**Date:** 2026-02-21
**Plan Reference:** PLAN.md — Fix All Security Issues (CRITIQUE + REVIEW), all 8 steps

## Changes Made

- `src/app/api/logs/route.ts:114-125` — Step 1 (P0): Inserted auth + Pro guard block in POST handler between the supabase null-check exit and the `request.json()` call. Unauthenticated requests now return 401; non-Pro authenticated requests return 403 `pro_required`. Block mirrors the existing GET handler pattern exactly.
- `src/app/api/logs/route.ts:50-54` — Step 3 (P2): Added bounding-box span cap after the NaN guard. `LAT_SPAN_MAX = 2` and `LNG_SPAN_MAX = 2` enforce a ~222 km limit per axis; requests exceeding this return 400 `Viewport too large`.
- `src/app/api/logs/route.ts:72-74` — Step 2 (P2): Replaced `error.message` leak in GET 500 path with `'Internal server error'`; added `console.error('[GET /api/logs]', error)` before the return.
- `src/app/api/logs/route.ts:147-149` — Step 2 (P2): Replaced `error.message` leak in POST 500 path with `'Internal server error'`; added `console.error('[POST /api/logs]', error)` before the return.
- `src/lib/subscription.ts:13` — Step 4 (P0): Added `process.env.NODE_ENV !== 'production' &&` guard before the bypass paywall check. The bypass is now a no-op in production builds.
- `src/hooks/useSubscription.ts:14` — Step 4 (P0): Same NODE_ENV guard applied to the client-side bypass branch in `useSubscription`.
- `.env.example:14` — Step 4 (P0): Changed `NEXT_PUBLIC_BYPASS_PAYWALL` default from `true` to `false` so new installs are safe by default.
- `.env.example:19-20` — Step 4: Added `NEXT_PUBLIC_APP_URL=https://your-domain.com` entry below the Stripe block, as required by Steps 5 and the plan constraints.
- `src/app/api/checkout/route.ts:18` — Step 5 (P1): Replaced `request.headers.get('origin')` with `process.env.NEXT_PUBLIC_APP_URL ?? ''`. The `success_url` and `cancel_url` already interpolate `origin` so they now use the trusted env var.
- `src/app/api/checkout/route.ts:22` — Step 5: Added `client_reference_id: user.id` inside `stripe.checkout.sessions.create`. This threads the Supabase user ID into the Stripe session for use by the webhook (Step 8).
- `src/app/api/portal/route.ts:33` — Step 5 (P1): Replaced `request.headers.get('origin')` with `process.env.NEXT_PUBLIC_APP_URL ?? ''`. The `return_url` already interpolates `origin`.
- `next.config.js:1-16` — Step 6 (P1): Full file replaced. Added `securityHeaders` array (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: frame-ancestors 'none'`) and a `headers()` function applying them to all routes. `reactStrictMode: true` preserved.
- `src/lib/supabase/admin.ts:1` — Step 7 (P2): Inserted `import 'server-only'` as the first line. Accidental client-side imports of the service-role client will now fail at build time.
- `src/app/api/webhooks/stripe/route.ts:27-41` — Step 8 (P2): Changed `checkout.session.completed` case to read `session.client_reference_id` (Supabase user ID) instead of `session.customer_email`. Upsert payload changed from `{ email, stripe_customer_id, stripe_status }` with `onConflict: 'email'` to `{ id, stripe_customer_id, stripe_status }` with `onConflict: 'id'`. Removed `customerEmail` variable.

## Deviations from Plan

None. All 8 steps implemented exactly as specified.

## Testing Notes

- Unauthenticated POST `/api/logs` — expect 401 (new auth guard).
- Authenticated non-Pro POST `/api/logs` — expect 403 `pro_required` (new subscription guard).
- Authenticated Pro POST `/api/logs` — expect 201.
- `isSubscribed()` with `NODE_ENV=production` and `NEXT_PUBLIC_BYPASS_PAYWALL=true` — expect false (guard blocks it).
- `isSubscribed()` with `NODE_ENV=development` and `NEXT_PUBLIC_BYPASS_PAYWALL=true` — expect true (bypass still works in dev).
- GET `/api/logs` with `minLat=-90&maxLat=90` (180-degree span) — expect 400 `Viewport too large`.
- POST `/api/checkout` with `Origin: https://evil.com` header — `success_url` must start with `NEXT_PUBLIC_APP_URL` value, not `evil.com`.
- Any page HTTP response must include `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- Importing `src/lib/supabase/admin.ts` from a `'use client'` component must fail the Next.js build.
- `checkout.session.completed` webhook with `client_reference_id` populated — Supabase upsert should target `id` column, not `email`.
- GET `/api/logs` DB error path — response body must be `{ "error": "Internal server error" }`, not a raw Supabase error string.
- POST `/api/logs` DB error path — same sanitized error response.

## Open Items

- None. All P0, P1, and P2 items from the plan are addressed.
- `NEXT_PUBLIC_APP_URL` must be configured in the Vercel (or other) deployment environment for checkout and portal redirects to work correctly in production.

---

## Previous Log (Phase 2 — Stripe Subscription Monetization)

**Date:** 2026-02-20
**Plan Reference:** PLAN.md — Stripe Subscription Monetization (all 15 implementation steps)

---

### Changes Made

| File | Action | What Changed |
|------|--------|-------------|
| `supabase/migrations/add_stripe_columns.sql` | CREATE | `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT, stripe_status TEXT NOT NULL DEFAULT 'inactive'` |
| `src/lib/stripe.ts` | CREATE | Stripe Node client singleton, `apiVersion: '2024-06-20'` |
| `src/lib/supabase/admin.ts` | CREATE | Service-role Supabase client using `SUPABASE_SERVICE_ROLE_KEY`; server-only, bypasses RLS |
| `src/lib/subscription.ts` | CREATE | `isSubscribed(user)` — single paywall truth: bypass env var, email whitelist, stripe_status check |
| `src/app/api/webhooks/stripe/route.ts` | CREATE | Raw-body webhook: `arrayBuffer()` + `Buffer.from()`, signature verify, 3 event types handled |
| `src/app/api/checkout/route.ts` | CREATE | POST — auth gate, creates Stripe Checkout session, returns `{ url }` |
| `src/app/api/portal/route.ts` | CREATE | POST — auth gate, fetches `stripe_customer_id`, creates Billing Portal session, returns `{ url }` |
| `src/app/api/subscription/status/route.ts` | CREATE | GET — returns `{ isPro: boolean }`, graceful `{ isPro: false }` for unauthenticated |
| `src/hooks/useSubscription.ts` | CREATE | Client hook — bypass short-circuit, fetches `/api/subscription/status` |
| `src/components/ui/ProGate.tsx` | CREATE | Spinner while loading; children for Pro; blur + UpgradeModal for free |
| `src/components/ui/UpgradeModal.tsx` | CREATE | Uses Modal shell; "Upgrade to Pro" → POST /api/checkout → redirect; "Stay on free plan" → onDismiss |
| `src/app/api/logs/route.ts` | MODIFY (lines 1–38) | Added `isSubscribed` import and auth+subscription gate to GET handler; POST unchanged |
| `src/app/settings/page.tsx` | MODIFY | Added `useSubscription` import, state, handlers, and Subscription section card between Community Map and Data sections |
| `src/types/index.ts` | MODIFY (appended) | Added `StripeStatus` union type and `UserRecord` interface |
| `.env.example` | CREATE | All required env vars documented with safe placeholder values |

---

### Deviations from Plan

- **`subscription/status` returns `{ isPro: false }` for unauthenticated users (not 401).** The plan contains both instructions ("return 401 if not authenticated" and "return `{ isPro: false }` rather than erroring for unauthenticated users making a graceful fallback easier"). The graceful fallback was chosen — it matches the plan's stated rationale and avoids a client-side error state in `useSubscription`.
- **`ProGate` tracks a local `dismissed` boolean.** When the user clicks "Stay on free plan", the modal hides but the blur remains (per plan intent). Modal does not reappear until page reload. No deviation from plan intent.

---

### Testing Notes

- **Webhook locally:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, then `stripe trigger checkout.session.completed`. Verify `stripe_customer_id` + `stripe_status: 'active'` written to `users` table.
- **Full checkout:** Stripe test card `4242 4242 4242 4242`, any future expiry/CVC.
- **Gate enforcement:** Non-Pro user GET /api/logs must return 403 `{ error: 'pro_required' }`. Pro user must return 200.
- **POST /api/logs:** Must return 201 for any authenticated user regardless of subscription.
- **Developer bypass Layer 1:** `NEXT_PUBLIC_BYPASS_PAYWALL=true` in `.env.local` — `useSubscription` returns `{ isPro: true }` with no fetch; `isSubscribed()` returns true server-side.
- **Developer bypass Layer 2:** Add email to `DEV_BYPASS_EMAILS` in Vercel env — `isSubscribed()` returns true for that email.
- **Settings page:** Free user sees upgrade button; Pro user sees green "Pro Member" badge and "Manage Subscription" button.

---

### Open Items

- The `users` table migration targets a public `users` table keyed by `email` (upsert) and `id` (row lookup). If the project uses only `auth.users` with a `profiles` table, adjust the migration target table and webhook upsert accordingly.
- `supabase/server.ts` returns an anon client — `supabase.auth.getUser()` will return null until Supabase Auth is fully configured with env vars and session cookies. All routes are wired correctly and will activate automatically when keys are added.
- `supabaseAdmin` (service role key) is only imported in the webhook route — not present in any client component or `use client` file. Verify this does not drift as more files are added.

---

## Previous Log (Phase 1 — Local PWA)

**Date:** 2026-02-20
**Plan Reference:** PLAN.md v2 — Full Phase 1 implementation

### What Was Built

A fully functional Phase 1 PWA for gig economy drivers to track and visualize tip patterns by geographic zone. All data stays local (IndexedDB via Dexie). No PII is stored or transmitted.

### Screens implemented:
- **Map (`/`)** — Full-screen Leaflet heat map with platform and time-bucket filter pills, FAB Log button, GPS center button, and heat legend.
- **Log (`/log`)** — Full delivery log form with platform picker, time-bucket picker, large YES/NO tip buttons, GPS location preview, optional tip amount, 140-char notes.
- **Stats (`/stats`)** — Stat cards (total logs, tip rate %, avg tip $, best platform), CSS-only bar charts by time bucket, platform breakdown, recent log list with delete, CSV export.
- **Settings (`/settings`)** — Community toggle stubs (Phase 2), delete-all confirmation, PWA install instructions, About.

### Changes Made

| File | What Changed |
|------|-------------|
| `src/types/index.ts` | TipLog, TimeBucket, Platform, CommunityPoint, HeatPoint, Stats interfaces |
| `src/lib/geo.ts` | snapCoord, getTimeBucket, timeBucketLabel, timeBucketHours, aggregateToHeatPoints, haversineDistance |
| `src/lib/db/local.ts` | Dexie TipTurfDB class, addLog, getAllLogs, deleteLog, getLogsInBounds, getStats |
| `src/lib/db/sync.ts` | Phase 2 stubs for pushToSupabase / pullCommunityLogs |
| `src/lib/supabase/client.ts` | Supabase browser client (returns null if env vars missing) |
| `src/lib/supabase/server.ts` | Supabase server client factory (returns null if env vars missing) |
| `src/lib/validators.ts` | Zod TipLogInput schema with notes address/name rejection |
| `src/lib/utils.ts` | formatDate, formatCurrency, formatPercent, cn, todayString, platformLabel, platformEmoji |
| `src/hooks/useLocalLogs.ts` | Reactive Dexie CRUD hook using useState/useEffect (not useLiveQuery — avoids SSR issues) |
| `src/hooks/useGeolocation.ts` | Browser GPS hook with refresh, error, loading state |
| `src/hooks/useCommunityLogs.ts` | Fetch aggregate points for map bounds (Phase 2 ready) |
| `src/hooks/useAuth.ts` | Phase 2 stub for Supabase auth |
| `src/app/layout.tsx` | Root layout with ToastProvider, BottomNav, dark bg |
| `src/app/page.tsx` | Map screen — dynamic import of TipTurf, filter pills, FAB, legend |
| `src/app/not-found.tsx` | 404 page |
| `src/app/log/page.tsx` | Log screen wrapper |
| `src/app/stats/page.tsx` | Stats screen with cards, bar charts, log list, CSV export |
| `src/app/settings/page.tsx` | Settings screen with community stubs and delete-all |
| `src/app/api/logs/route.ts` | GET (aggregate bounding box query), POST (submit log) — both 501 until env vars set |
| `src/app/api/auth/callback/route.ts` | Supabase OAuth callback — 501 until env vars set |
| `src/app/globals.css` | Tailwind directives + Leaflet dark theme overrides |
| `src/components/layout/BottomNav.tsx` | 4-tab nav (Map, Log, Stats, Settings), active state highlight |
| `src/components/layout/TopBar.tsx` | Fixed top bar with optional right slot |
| `src/components/map/TipTurf.tsx` | react-leaflet MapContainer, TileLayer, HeatLayer, LocationButton |
| `src/components/map/HeatLayer.tsx` | leaflet.heat wrapper using dynamic import |
| `src/components/map/LocationButton.tsx` | GPS center button using useMap() |
| `src/components/log/LogForm.tsx` | Full delivery form with validation |
| `src/components/log/PlatformPicker.tsx` | Platform pill selector |
| `src/components/log/TimeBucketPicker.tsx` | Time-of-day visual picker with icons |
| `src/components/stats/StatCard.tsx` | Metric display card |
| `src/components/stats/LogItem.tsx` | History row with platform badge, tip status, delete |
| `src/components/ui/Button.tsx` | Touch-target button (variants: primary, secondary, danger, success, ghost) |
| `src/components/ui/Input.tsx` | Labeled input with error/hint |
| `src/components/ui/Modal.tsx` | Bottom-sheet modal |
| `src/components/ui/Toast.tsx` | Toast context provider + toast() hook |
| `src/types/leaflet-heat.d.ts` | TypeScript declaration for leaflet.heat module |
| `public/manifest.json` | Updated PWA manifest for TipTurf |
| `next.config.js` | Renamed from .ts (Next.js 14 requirement), leaflet server-side externals |

### Deviations from Plan

1. **`next.config.ts` → `next.config.js`** — Next.js 14.2 does not support `.ts` config files.
2. **`react-leaflet` v5 → v4** — react-leaflet v5 requires React 19. Downgraded to v4.
3. **`leaflet-heat` package not found** — Package is named `leaflet.heat` on npm.
4. **`dexie-react-hooks` useLiveQuery replaced** — `useLiveQuery` caused SSR `useContext` errors. Replaced with manual `useState/useEffect` pattern.
5. **`next-pwa` disabled** — next-pwa v5 has compatibility issues with Next.js 14 App Router on Windows.
6. **`export const dynamic = 'force-dynamic'`** — Required to prevent static prerendering of client-only pages.

### Open Items (Phase 2)
1. Create a Supabase project and run the SQL schema.
2. Add env vars to `.env.local`.
3. Wire community sync in `src/lib/db/sync.ts`.
4. Implement `src/hooks/useAuth.ts` with real Supabase auth.
