'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export function useAuth(): {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
} {
  // Supabase env vars absent: return safe no-op stubs
  if (!supabase) {
    return {
      user: null,
      session: null,
      loading: false,
      signIn: async () => ({ error: 'Auth is not configured.' }),
      signUp: async () => ({ error: 'Auth is not configured.' }),
      signOut: async () => {},
    };
  }

  const sb = supabase; // non-null after early return above

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [user, setUser] = useState<User | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [session, setSession] = useState<Session | null>(null);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = sb.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signUp(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await sb.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut(): Promise<void> {
    await sb.auth.signOut();
  }

  return { user, session, loading, signIn, signUp, signOut };
}
