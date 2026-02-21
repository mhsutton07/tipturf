# Vault — TipTurf

## Directory Structure
tipturf/
├── src/app/          (layout.tsx, page.tsx, log/, stats/, settings/, api/logs/, api/auth/)
├── src/components/   (layout/BottomNav+TopBar, map/TipMap+HeatLayer+LocationButton,
│                      log/LogForm+PlatformPicker+TimeBucketPicker,
│                      stats/StatCard+LogItem, ui/Button+Input+Modal+Toast)
├── src/hooks/        (useLocalLogs, useGeolocation, useCommunityLogs, useAuth)
├── src/lib/          (db/local.ts, db/sync.ts, supabase/client+server, geo.ts, validators.ts, utils.ts)
├── src/types/        (index.ts, leaflet-heat.d.ts)
├── public/           (manifest.json, sw.js, workbox, icons/)
└── docs/context/

## Project Summary
TipTurf is a mobile-first PWA for gig economy drivers (Uber Eats, DoorDash, Instacart, etc.) that shows a geographic heatmap of tip rates using lat/long + time-of-day data only — zero PII. Drivers log deliveries (platform, tipped Y/N, optional tip $, GPS coords snapped to ~111m grid). Local Phase 1 is fully implemented. Community Supabase sync (Phase 2) is stubbed. No monetization implemented yet.

## Tech Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Dexie.js (IndexedDB) for offline-first local storage
- Leaflet + react-leaflet + leaflet-heat for interactive heatmap
- Supabase (Postgres + Auth) — community layer stubbed, env vars not yet set
- Stripe — to be integrated for subscription monetization
- PWA: manifest.json + sw.js present, installable
- Vercel deployment target
