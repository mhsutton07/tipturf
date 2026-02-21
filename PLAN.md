# Plan: Fix All Security Issues (CRITIQUE + REVIEW)
**Date:** 2026-02-21
**Status:** READY FOR IMPLEMENTATION

## Objective
Resolve all P0, P1, and P2 security findings from CRITIQUE.md and REVIEW.md so the application
can safely deploy to production. No new features are introduced.

## Context Summary
- **From Review:** Eight issues across P1 and P2. Must-fix before launch: unauthenticated
  POST /api/logs, unguarded NEXT_PUBLIC_BYPASS_PAYWALL, reflected origin header in checkout and
  portal, missing security headers.
- **From Critique:** Upgraded two P1 findings to P0 deploy-blockers — the unauthenticated write
  path and the unguarded bypass variable. Critique and Review are consistent; no conflicts.
- **Constraints:** No Supabase schema changes required. No new npm dependencies required
  (`server-only` ships with Next.js 13+). All changes are TypeScript source files or config.
  `NEXT_PUBLIC_APP_URL` must be added to `.env.example` and set in the deployment environment.

---

## Implementation Steps

### Step 1 — P0: Add auth + Pro guard to POST /api/logs
**File:** `src/app/api/logs/route.ts`

The POST handler at line 94 has no auth check. The supabase null-check exits at lines 97-105;
after that (currently line 107) insert the same auth + isSubscribed block the GET handler uses
(GET lines 24-38):

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const { data: userRow } = await supabase
  .from('users')
  .select('email, stripe_status')
  .eq('id', user.id)
  .single();
if (!userRow || !isSubscribed({ email: userRow.email, stripe_status: userRow.stripe_status })) {
  return NextResponse.json({ error: 'pro_required' }, { status: 403 });
}
```

Insert this block between line 105 (`}`) and line 107 (`const body = await request.json();`).

### Step 2 — P2: Replace raw error strings surfaced to client
**File:** `src/app/api/logs/route.ts`

- Line 67: change `{ error: error.message }` to `{ error: 'Internal server error' }`.
  Add `console.error('[GET /api/logs]', error);` on the line before the return.
- Line 128: same change — `{ error: error.message }` to `{ error: 'Internal server error' }`.
  Add `console.error('[POST /api/logs]', error);` on the line before the return.

### Step 3 — P2: Cap bounding-box query size in GET /api/logs
**File:** `src/app/api/logs/route.ts`

After the NaN guard (line 46-48, which returns 400 on NaN), insert a span cap at line 49
(before the `platform` read at line 50):

```ts
const LAT_SPAN_MAX = 2;
const LNG_SPAN_MAX = 2;
if (maxLat - minLat > LAT_SPAN_MAX || maxLng - minLng > LNG_SPAN_MAX) {
  return NextResponse.json({ error: 'Viewport too large' }, { status: 400 });
}
```

2 degrees in each axis covers roughly 222 km — larger than any single metro delivery zone.

### Step 4 — P0: Gate NEXT_PUBLIC_BYPASS_PAYWALL behind NODE_ENV !== 'production'
**File:** `src/lib/subscription.ts`

Line 13 — change:
```ts
if (process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') return true;
```
to:
```ts
if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') return true;
```

**File:** `src/hooks/useSubscription.ts`

Line 14 — change:
```ts
if (process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') {
```
to:
```ts
if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_BYPASS_PAYWALL === 'true') {
```

**File:** `.env.example`

Line 14 — change:
```
NEXT_PUBLIC_BYPASS_PAYWALL=true
```
to:
```
NEXT_PUBLIC_BYPASS_PAYWALL=false
```

Also add the new required variable below the Stripe block:
```
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 5 — P1: Replace reflected origin header in checkout and portal
**File:** `src/app/api/checkout/route.ts`

Line 18 — replace:
```ts
const origin = request.headers.get('origin') ?? '';
```
with:
```ts
const origin = process.env.NEXT_PUBLIC_APP_URL ?? '';
```
Lines 24-25 (`success_url` and `cancel_url`) are unchanged; they already interpolate `origin`.

Also add `client_reference_id: user.id` inside the `stripe.checkout.sessions.create({...})`
call (line 20-26) alongside `mode`. This threads the Supabase user ID into the webhook (Step 7).

**File:** `src/app/api/portal/route.ts`

Line 33 — replace:
```ts
const origin = request.headers.get('origin') ?? '';
```
with:
```ts
const origin = process.env.NEXT_PUBLIC_APP_URL ?? '';
```
Line 37 (`return_url`) is unchanged.

### Step 6 — P1: Add security headers to next.config.js
**File:** `next.config.js`

The current file is 6 lines. Replace the full content:

```js
/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
```

### Step 7 — P2: Add 'server-only' guard to admin.ts
**File:** `src/lib/supabase/admin.ts`

The file is 9 lines. Insert `import 'server-only';` as the very first line, before the existing
comment on line 1. This converts an accidental client-side import into a build error.

### Step 8 — P2: Switch webhook upsert from email to Supabase user ID
**File:** `src/app/api/webhooks/stripe/route.ts`

Lines 27-39 (the `checkout.session.completed` case). Currently reads `session.customer_email`
and upserts with `onConflict: 'email'`. Change to read `session.client_reference_id`
(the Supabase user ID set in Step 5) and upsert on `id`:

```ts
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.client_reference_id;   // Supabase user ID from checkout creation
  const customerId = typeof session.customer === 'string' ? session.customer : null;

  if (userId && customerId) {
    await supabaseAdmin
      .from('users')
      .upsert(
        { id: userId, stripe_customer_id: customerId, stripe_status: 'active' },
        { onConflict: 'id' }
      );
  }
  break;
}
```

Remove the `customerEmail` variable; the upsert no longer uses `email` as the conflict key.

---

## File Inventory

| File | Action | Lines / Targets Affected |
|------|--------|--------------------------|
| `src/app/api/logs/route.ts` | MODIFY | Auth block inserted after L105; error leaks fixed L67, L128; bbox cap inserted after L48 |
| `src/lib/subscription.ts` | MODIFY | L13 — add `NODE_ENV !== 'production'` guard |
| `src/hooks/useSubscription.ts` | MODIFY | L14 — add `NODE_ENV !== 'production'` guard |
| `.env.example` | MODIFY | L14 — flip `NEXT_PUBLIC_BYPASS_PAYWALL` default to `false`; add `NEXT_PUBLIC_APP_URL` |
| `src/app/api/checkout/route.ts` | MODIFY | L18 reflected origin replaced; `client_reference_id` added to session create (L20-26) |
| `src/app/api/portal/route.ts` | MODIFY | L33 reflected origin replaced |
| `next.config.js` | MODIFY | Full file replaced — add `headers()` security block |
| `src/lib/supabase/admin.ts` | MODIFY | `import 'server-only'` inserted as L1 |
| `src/app/api/webhooks/stripe/route.ts` | MODIFY | L27-39 — upsert changed from email/onConflict:'email' to id/onConflict:'id' |

---

## Architecture Decisions
- **NODE_ENV guard, not removal of bypass:** The bypass serves a legitimate dev purpose. Gating
  it behind `NODE_ENV !== 'production'` closes the production risk without removing the DX benefit.
- **Hardcode APP_URL from env var:** `NEXT_PUBLIC_APP_URL` is the conventional Next.js/Vercel
  variable for this purpose. No new patterns are introduced.
- **client_reference_id for webhook linkage:** Stripe's documented pattern for carrying
  application-layer identity through a checkout session. Required for the upsert-on-id fix.
- **2-degree bbox cap:** Covers ~222 km — larger than any metro delivery zone but still prevents
  full-table scraping in a single request. Can be tuned later without a schema change.
- **frame-ancestors CSP instead of X-Frame-Options alone:** Modern spec. Both are set for
  backward compatibility with older browsers.

---

## Testing Strategy
- Unauthenticated POST `/api/logs` — expect 401.
- Authenticated non-Pro POST `/api/logs` — expect 403.
- Authenticated Pro POST `/api/logs` — expect 201.
- `isSubscribed()` called with `NODE_ENV=production` and `NEXT_PUBLIC_BYPASS_PAYWALL=true` — expect false.
- `isSubscribed()` called with `NODE_ENV=development` and `NEXT_PUBLIC_BYPASS_PAYWALL=true` — expect true.
- GET `/api/logs` with full-world bbox (`minLat=-90, maxLat=90`) — expect 400.
- POST `/api/checkout` with `Origin: https://evil.com` header — `success_url` must start with `NEXT_PUBLIC_APP_URL`, not `evil.com`.
- Any page response must include `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff` headers.
- Importing `src/lib/supabase/admin.ts` inside a `'use client'` component must fail the build.
- `checkout.session.completed` webhook with `client_reference_id` set — verify Supabase upserts on `id` column, not `email`.

---

## Out of Scope
- Migrating `createServerClient` to `@supabase/ssr` cookie-based sessions (P3 backlog item).
- Updating VAULT.md stale content (P3 ops task, not a security fix).
- Configuring Stripe dashboard redirect allowlists (external service config).
- Any changes to Supabase schema or RLS policies.
- Any new product features or refactors beyond the nine steps above.

---

## Acceptance Criteria
- [ ] Unauthenticated POST to `/api/logs` returns 401.
- [ ] Non-Pro authenticated POST to `/api/logs` returns 403 `pro_required`.
- [ ] `isSubscribed()` returns false in `NODE_ENV=production` when bypass var is `'true'`.
- [ ] `useSubscription` bypass branch is unreachable in production builds.
- [ ] `.env.example` `NEXT_PUBLIC_BYPASS_PAYWALL` default is `false`.
- [ ] `.env.example` includes `NEXT_PUBLIC_APP_URL` entry.
- [ ] `/api/checkout` and `/api/portal` use `NEXT_PUBLIC_APP_URL` for all redirect URLs.
- [ ] `checkout.session.completed` webhook upserts on `id`, not `email`.
- [ ] All HTTP responses include `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.
- [ ] `import 'server-only'` in `admin.ts` causes a build error when imported client-side.
- [ ] Raw Supabase error strings are no longer returned to callers from `/api/logs`.
- [ ] GET `/api/logs` with a >2-degree bounding box returns 400 `Viewport too large`.
