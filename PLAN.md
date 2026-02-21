# Plan: Auth Wiring + Settings Cleanup
**Date:** 2026-02-21
**Status:** READY FOR IMPLEMENTATION

## Objective
Wire up real Supabase email/password auth so checkout no longer 401s on unauthenticated users,
and clean up the Settings page by removing all phase/version language and making the community
toggles functional.

## Context Summary
- **From Review:** N/A
- **From Research:** N/A
- **Constraints:**
  - `supabase/client.ts` returns `null` when env vars are absent — all callers must null-check
  - `supabase/server.ts` uses plain `createClient`, not `@supabase/ssr` — keep it that way; client-side Supabase SDK persists sessions in localStorage, no server cookies required for this flow
  - `/auth/callback/route.ts` already exists and correctly calls `exchangeCodeForSession` — only the leading comment needs updating; the logic handles email confirmation links already
  - `useAuth` stubs both `signIn` and `signOut` with thrown errors — full file replacement required
  - `UpgradeModal` calls `/api/checkout` with no user check — needs a login gate inserted before the fetch
  - `settings/page.tsx` imports `useSubscription` from `@/hooks/useSubscription` — do not remove that import

---

## Implementation Steps

### 1. `src/hooks/useAuth.ts` — REPLACE entire file
- Import `supabase` from `@/lib/supabase/client`
- On mount, call `supabase.auth.getSession()` to hydrate initial state, then subscribe to `supabase.auth.onAuthStateChange` to keep `user` and `session` live
- Implement `signIn(email: string, password: string)` — calls `supabase.auth.signInWithPassword`; returns `{ error }` so the caller can display it inline
- Implement `signUp(email: string, password: string)` — calls `supabase.auth.signUp`; same return shape
- Implement `signOut()` — calls `supabase.auth.signOut()`
- If `supabase` is null (env vars absent), return `{ user: null, session: null, loading: false }` with no-op stubs for all functions — prevents crashes on local dev
- Export signature: `useAuth(): { user, session, signIn, signUp, signOut, loading }`

### 2. `src/app/login/page.tsx` — CREATE new file
- `'use client'` component
- Local state: `mode` (`'signin' | 'signup'`), `email`, `password`, `error`, `submitting`
- Read `?returnTo=` from `useSearchParams()`; default to `'/'`
- On submit: call `signIn` or `signUp` from `useAuth`; on success call `router.push(returnTo)`; on error set `error` state and display it beneath the form
- Toggle link at the bottom switches between modes, clears `error`
- Layout: full-screen `bg-gray-950`, centered card `bg-gray-900 rounded-2xl p-6 max-w-sm mx-auto mt-24`
- Use the existing `Button` component (`variant="primary" size="lg"`) for the submit button
- Use plain `<input>` styled consistently with the rest of the app (`bg-gray-800 text-white rounded-xl px-4 py-3 w-full`)
- Title: "Welcome to TipTurf" (sign in mode) / "Create your account" (sign up mode)
- No TopBar on this page is preferred, but the global `BottomNav` will still render — that is acceptable

### 3. `src/app/api/auth/callback/route.ts` — UPDATE comment only
- Remove the comment on L4 (`// Supabase OAuth callback handler (Phase 2)`)
- Replace with `// Handles Supabase email confirmation redirects`
- No functional changes — the `exchangeCodeForSession` logic is correct as-is

### 4. `src/components/ui/UpgradeModal.tsx` — ADD login gate
- Add imports: `useAuth` from `@/hooks/useAuth`, `useRouter` from `next/navigation`
- In `handleUpgrade()`, before the `fetch('/api/checkout')` call:
  - Read `user` from `useAuth()`
  - If `user` is null: call `onDismiss()` then `router.push('/login?returnTo=/')`; return early
- All other logic in the component stays unchanged

### 5. `src/app/settings/page.tsx` — CLEANUP + TOGGLE WIRING

**State changes (top of component):**
- Change `communityShare` initial value from `false` to `true` — ON by default
- Add `const [showShareOffConfirm, setShowShareOffConfirm] = useState(false)` for the opt-out confirmation modal
- In a `useEffect` on mount, read `localStorage.getItem('tipturf_community_share')` and set state accordingly (default to `true` if key is absent)
- In a `useEffect` watching `communityShare`, write `localStorage.setItem('tipturf_community_share', String(communityShare))`

**Community Map section — subtitle (L63-64):**
- Remove: `Phase 2 — requires Supabase setup. Your data never leaves your device until you opt in.`
- Replace with: `Your data stays on your device until you share it.`

**"Share my logs" toggle handler (L73):**
- Replace the `() => toast('Phase 2: Supabase not yet configured.', 'info')` onClick with a real handler:
  ```
  if communityShare is currently true (toggling OFF):
    setShowShareOffConfirm(true)   // show confirmation modal, don't change state yet
  else (toggling ON):
    setCommunityShare(true)
    call POST /api/logs with body = JSON.stringify(logs)
    on success: toast('Your logs are now shared with the community.', 'success')
    on error: toast('Could not sync logs. Try again later.', 'error'); setCommunityShare(false)
  ```
- Add the confirmation modal using the existing `Modal` component after the community section JSX:
  - `open={showShareOffConfirm}` `onClose={() => setShowShareOffConfirm(false)}` `title="Stop sharing your logs?"`
  - Body: `"Your past contributions stay on the map, but new logs won't be added."`
  - Two buttons: "Keep sharing" (secondary, closes modal) and "Stop sharing" (danger, sets communityShare false, closes modal)

**"Show community data" toggle handler (L92):**
- Replace `() => toast('Phase 2: Supabase not yet configured.', 'info')` with `() => setCommunityView(!communityView)`

**Em dash in Subscription section (L141):**
- `'Upgrade to Pro — $6.99/mo'` → `'Upgrade to Pro · $6.99/mo'`

**About section (L183-185):**
- Remove: `<p>Version 0.1.0 (Phase 1 — Local only)</p>`
- Replace the remaining two `<p>` lines with:
  ```
  <p>Know before you go.</p>
  <p>TipTurf shows gig drivers where tips are highest, broken down by neighborhood and time of day.</p>
  ```

---

## File Inventory
| File | Action | Lines/Functions Affected |
|------|--------|--------------------------|
| `src/hooks/useAuth.ts` | REPLACE | Entire file — new implementation |
| `src/app/login/page.tsx` | CREATE | New file |
| `src/app/api/auth/callback/route.ts` | MODIFY | L4 comment only |
| `src/components/ui/UpgradeModal.tsx` | MODIFY | Add 2 imports; `handleUpgrade()` L14-25 |
| `src/app/settings/page.tsx` | MODIFY | State init L16-17; useEffect (new); L63-64 subtitle; L73 share handler; L92 view handler; L141 em dash; L183-185 about section |

---

## Architecture Decisions
- **Client-side session only, no SSR cookies:** `supabase-js` v2 stores the JWT in localStorage automatically. The existing server client (`createClient` with anon key) is sufficient for this plan. API routes that need user identity should read the `Authorization: Bearer <token>` header — wiring that is out of scope here.
- **No OAuth, no magic links:** Email/password only as specified. The callback route stays because Supabase sends a confirmation email on sign-up and the existing handler already resolves it.
- **Toggle persistence in localStorage:** Community preferences are UX state, not server state. Read on mount with `useEffect`, write on every change. Default to ON for `communityShare` if key is absent.
- **Confirmation modal for toggling share OFF:** Uses the existing `Modal` component — no new UI primitives. Friction is intentional but not a hard block.
- **Login gate in UpgradeModal, not middleware:** The task specifies minimal auth. Adding Next.js middleware for route protection is a separate concern and is explicitly out of scope.

---

## Testing Strategy
- Sign up with a new email — verify the Supabase confirmation email arrives, clicking it hits `/auth/callback`, session is established, and the user is redirected to `/`
- Sign in with existing credentials — verify `user` is non-null and persists on page refresh
- Sign out — verify `user` returns to null
- Open `UpgradeModal` while signed out — confirm redirect to `/login?returnTo=/`, no 401
- Open `UpgradeModal` while signed in — confirm checkout fetch proceeds normally
- Toggle "Share my logs" ON — confirm `POST /api/logs` is called with local log data, success toast appears
- Toggle "Share my logs" OFF — confirm confirmation modal appears; clicking "Keep sharing" leaves state unchanged; clicking "Stop sharing" sets toggle to OFF
- Verify Settings page has no `—` characters in rendered output
- Verify About section has no version string and no "Phase" text
- Verify `communityShare = true` is the default for a fresh user (no localStorage key present)

---

## Out of Scope
- OAuth providers (Google, Apple, etc.)
- Magic link / passwordless auth
- Server-side session validation in `/api/checkout`, `/api/portal`, `/api/logs` — those API routes may still 401 if they validate the session server-side; fixing API auth middleware is a separate task
- Next.js middleware for protecting routes at the edge
- Actually wiring `communityView` state to show/hide the map overlay
- Stripe checkout session creation or subscription management
- Password reset / forgot password flow
- Supabase project setup or env var configuration (assumed complete before implementation)

---

## Acceptance Criteria
- [ ] `useAuth` returns a live `user` object after sign-in (not null) and null after sign-out
- [ ] `useAuth` returns safe no-op stubs (no thrown errors) when Supabase env vars are absent
- [ ] `/login` page renders, toggles between sign-in and sign-up modes, and redirects to `returnTo` on success
- [ ] `UpgradeModal` redirects unauthenticated users to `/login` instead of hitting `/api/checkout`
- [ ] Settings page contains zero em dash characters in any visible text
- [ ] "Phase 2", "Phase 1", and version strings are absent from the Settings page
- [ ] "Share my logs" toggle defaults to ON for new users
- [ ] Toggling "Share my logs" ON calls `POST /api/logs` with local log data
- [ ] Toggling "Share my logs" OFF requires confirming through the modal before state changes
- [ ] About section contains no version number and no phase reference
