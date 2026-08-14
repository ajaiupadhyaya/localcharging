import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token ?? '');
  if (!user) return new Response('Unauthorized', { status: 401, headers: cors });

  const { bookingId, event } = await req.json();
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, driver_id, charger_id, chargers(host_id, name)')
    .eq('id', bookingId)
    .single();
  if (!booking) return Response.json({ error: 'not found' }, { status: 404, headers: cors });

  const charger = booking.chargers as { host_id: string; name: string };
  const hostId = charger.host_id;
  const targetId = event === 'booking_requested' ? hostId : booking.driver_id;
  const { data: profile } = await supabase.from('profiles').select('expo_push_token').eq('id', targetId).single();
  if (!profile?.expo_push_token) {
    return Response.json({ skipped: true }, { headers: cors });
  }

  const copy: Record<string, { title: string; body: string }> = {
    booking_requested: { title: 'New charging request', body: `Someone asked to charge at ${charger.name}.` },
    booking_approved: { title: "You're approved", body: `${charger.name} is ready for you.` },
    booking_declined: { title: 'Request declined', body: `${charger.name} isn't available for that window.` },
    booking_cancelled: { title: 'Booking cancelled', body: `The session at ${charger.name} was cancelled.` },
  };
  const msg = copy[event] ?? { title: 'ChargeLocal', body: 'Your booking was updated.' };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      to: profile.expo_push_token,
      title: msg.title,
      body: msg.body,
      data: { bookingId, event },
    }),
  });

  return Response.json({ sent: true }, { headers: cors });
});
