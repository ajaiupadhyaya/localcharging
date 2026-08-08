import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token ?? '');
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const action = body.action as string;

  if (action === 'create_connect_link') {
    let accountId = body.accountId as string | undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({ type: 'express', email: user.email! });
      accountId = account.id;
      await supabase.from('profiles').update({ stripe_connect_account_id: accountId }).eq('id', user.id);
    }
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: body.refreshUrl ?? 'chargelocal://host',
      return_url: body.returnUrl ?? 'chargelocal://host',
      type: 'account_onboarding',
    });
    return Response.json({ url: link.url });
  }

  if (action === 'create_payment_intent') {
    const amount = Math.round((body.amount as number) * 100);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: body.customerId,
      capture_method: 'manual',
      metadata: { booking_id: body.bookingId },
    });
    return Response.json({ clientSecret: intent.client_secret });
  }

  return new Response('Unknown action', { status: 400 });
});
