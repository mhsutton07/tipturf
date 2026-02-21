import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const buf = Buffer.from(await request.arrayBuffer());
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;   // Supabase user ID from checkout creation
      const customerId = typeof session.customer === 'string' ? session.customer : null;

      if (userId && customerId) {
        await supabaseAdmin
          .from('profiles')
          .upsert(
            { id: userId, stripe_customer_id: customerId, stripe_status: 'active' },
            { onConflict: 'id' }
          );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;
      const status = subscription.status;

      if (customerId) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_status: status })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

      if (customerId) {
        await supabaseAdmin
          .from('profiles')
          .update({ stripe_status: 'canceled' })
          .eq('stripe_customer_id', customerId);
      }
      break;
    }

    default:
      // Ignore all other event types
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
