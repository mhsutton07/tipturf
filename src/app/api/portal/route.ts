import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 401 });
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userRow } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const stripeCustomerId = userRow?.stripe_customer_id as string | null | undefined;

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 400 }
    );
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
