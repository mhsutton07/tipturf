import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Handles Supabase email confirmation redirects
export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error: 'Not Implemented',
        message: 'TODO: add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars',
      },
      { status: 501 }
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/settings?error=auth_failed`);
}
