import 'server-only';
// Server-only: service-role Supabase client that bypasses RLS.
// Used exclusively by the Stripe webhook handler to write subscription status.
// NEVER import this file in any client component or any file marked 'use client'.
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
