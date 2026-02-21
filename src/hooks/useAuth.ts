'use client';

// TODO: Phase 2 — wire up Supabase auth
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars

export function useAuth() {
  return {
    user: null,
    session: null,
    loading: false,
    signIn: async () => {
      throw new Error('Phase 2: Auth not yet configured');
    },
    signOut: async () => {
      throw new Error('Phase 2: Auth not yet configured');
    },
  };
}
