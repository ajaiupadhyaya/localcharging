import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-12-18.acacia' });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) {
    return new Response(JSON.stringify({ error: 'Stripe is not configured (test mode keys missing)' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token ?? '');
  if (!user) return new Response('Unauthorized', { status: 401, headers: cors });

  const body = await req.json();
  const action = body.action as string;

  if (action === 'create_connect_link') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();
    let accountId = (body.accountId as string | undefined) ?? profile?.stripe_connect_account_id ?? undefined;
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
    return Response.json({ url: link.url }, { headers: cors });
  }

  if (action === 'create_payment_intent') {
    const bookingId = body.bookingId as string;
    const amount = Math.round((body.amount as number) * 100);
    if (!bookingId || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400, headers: cors });
    }
    const { data: booking } = await supabase.from('bookings').select('*, chargers(host_id)').eq('id', bookingId).single();
    if (!booking || booking.driver_id !== user.id) {
      return new Response('Unauthorized', { status: 401, headers: cors });
    }
    const hostId = (booking.chargers as { host_id: string }).host_id;
    const { data: feeRow } = await supabase.from('platform_settings').select('value').eq('key', 'platform_fee_rate').maybeSingle();
    const feeRate = Number(feeRow?.value ?? 0.12);
    const platformFee = Math.round((body.amount as number) * feeRate * 100) / 100;

    let customerId = body.customerId as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      capture_method: 'manual',
      metadata: { booking_id: bookingId },
    });

    const { data: payment } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        driver_id: booking.driver_id,
        host_id: hostId,
        provider_payment_id: intent.id,
        amount: body.amount,
        platform_fee: platformFee,
        host_amount: Math.round(((body.amount as number) - platformFee) * 100) / 100,
        status: 'authorized',
      })
      .select('id')
      .single();

    return Response.json({ clientSecret: intent.client_secret, paymentId: payment?.id }, { headers: cors });
  }

  if (action === 'capture_payment') {
    const bookingId = body.bookingId as string;
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .in('status', ['authorized', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment?.provider_payment_id) {
      return Response.json({ skipped: true }, { headers: cors });
    }
    const amount = body.amount != null ? Math.round((body.amount as number) * 100) : undefined;
    await stripe.paymentIntents.capture(payment.provider_payment_id, amount ? { amount_to_capture: amount } : undefined);
    await supabase.from('payments').update({ status: 'captured' }).eq('id', payment.id);
    return Response.json({ captured: true }, { headers: cors });
  }

  if (action === 'cancel_payment') {
    const bookingId = body.bookingId as string;
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .in('status', ['authorized', 'pending'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!payment?.provider_payment_id) {
      return Response.json({ skipped: true }, { headers: cors });
    }
    await stripe.paymentIntents.cancel(payment.provider_payment_id);
    await supabase.from('payments').update({ status: 'cancelled' }).eq('id', payment.id);
    return Response.json({ cancelled: true }, { headers: cors });
  }

  return new Response('Unknown action', { status: 400, headers: cors });
});
