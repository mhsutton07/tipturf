import 'server-only';
// Server-only: service-role Supabase client that bypasses RLS.
// Used exclusively by the Stripe webhook handler to write subscription status.
// NEVER import this file in any client component or any file marked 'use client'.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin env vars not set');
    _admin = createClient(url, key);
  }
  return _admin;
}
