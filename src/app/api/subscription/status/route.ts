import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isSubscribed } from '@/lib/subscription';

export async function GET(_request: NextRequest) {
  const supabase = createServerClient();

  if (!supabase) {
    // Supabase not yet configured — graceful fallback
    return NextResponse.json({ isPro: false });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isPro: false });
  }

  const { data: userRow } = await supabase
    .from('profiles')
    .select('email, stripe_status')
    .eq('id', user.id)
    .single();

  if (!userRow) {
    return NextResponse.json({ isPro: false });
  }

  return NextResponse.json({
    isPro: isSubscribed({ email: userRow.email, stripe_status: userRow.stripe_status }),
  });
}
