import { supabase } from '@/lib/auth/supabase';

export async function createConnectOnboardingLink(refreshUrl?: string, returnUrl?: string) {
  const { data: session } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'create_connect_link', refreshUrl, returnUrl },
    headers: { Authorization: `Bearer ${session.session?.access_token}` },
  });
  if (error) throw error;
  return data.url as string;
}

export async function authorizeBookingPayment(bookingId: string, amount: number, customerId?: string) {
  const { data: session } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('stripe', {
    body: { action: 'create_payment_intent', bookingId, amount, customerId },
    headers: { Authorization: `Bearer ${session.session?.access_token}` },
  });
  if (error) throw error;
  return data.clientSecret as string;
}

export async function recordPayment(bookingId: string, driverId: string, hostId: string, amount: number, platformFee: number) {
  await supabase.from('payments').insert({
    booking_id: bookingId,
    driver_id: driverId,
    host_id: hostId,
    amount,
    platform_fee: platformFee,
    host_amount: amount - platformFee,
    status: 'authorized',
  });
}
