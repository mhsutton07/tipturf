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

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    client_reference_id: user.id,
    customer_email: user.email,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/?subscribed=true`,
    cancel_url: `${origin}/`,
  });

  return NextResponse.json({ url: session.url });
}
