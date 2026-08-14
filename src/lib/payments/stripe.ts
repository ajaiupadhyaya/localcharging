import { supabase } from '@/lib/auth/supabase';

async function invokeStripe(body: Record<string, unknown>) {
  const { data: session } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('stripe', {
    body,
    headers: { Authorization: `Bearer ${session.session?.access_token}` },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function createConnectOnboardingLink(refreshUrl?: string, returnUrl?: string) {
  const data = await invokeStripe({ action: 'create_connect_link', refreshUrl, returnUrl });
  return data.url as string;
}

export async function authorizeBookingPayment(bookingId: string, amount: number, customerId?: string) {
  const data = await invokeStripe({
    action: 'create_payment_intent',
    bookingId,
    amount,
    customerId,
  });
  return {
    clientSecret: data.clientSecret as string,
    paymentId: data.paymentId as string | undefined,
  };
}

export async function captureBookingPayment(bookingId: string, amount?: number) {
  return invokeStripe({ action: 'capture_payment', bookingId, amount });
}

export async function cancelBookingPayment(bookingId: string) {
  return invokeStripe({ action: 'cancel_payment', bookingId });
}

export async function notifyBooking(bookingId: string, event: string) {
  const { data: session } = await supabase.auth.getSession();
  await supabase.functions.invoke('notify', {
    body: { bookingId, event },
    headers: { Authorization: `Bearer ${session.session?.access_token}` },
  });
}
