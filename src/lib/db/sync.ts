// TODO: Phase 2 — Supabase sync
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars

import type { TipLog, CommunityPoint } from '@/types';

export async function pushToSupabase(_logs: TipLog[]): Promise<void> {
  throw new Error('Phase 2: Supabase sync not yet configured. Add env vars.');
}

export async function pullCommunityLogs(
  _minLat: number,
  _maxLat: number,
  _minLng: number,
  _maxLng: number
): Promise<CommunityPoint[]> {
  throw new Error('Phase 2: Community data not yet configured. Add env vars.');
}
