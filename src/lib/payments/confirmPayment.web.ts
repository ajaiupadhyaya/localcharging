export async function confirmBookingPayment(clientSecret: string): Promise<void> {
  const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) throw new Error('Stripe publishable key missing');

  await loadStripeJs();
  const StripeCtor = (window as unknown as { Stripe: (key: string) => StripeLike }).Stripe;
  const stripe = StripeCtor(pk);
  const { error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: 'pm_card_visa',
  });
  if (error) throw new Error(error.message);
}

interface StripeLike {
  confirmCardPayment: (
    secret: string,
    opts: { payment_method: string },
  ) => Promise<{ error?: { message: string } }>;
}

function loadStripeJs(): Promise<void> {
  const w = window as unknown as { Stripe?: unknown };
  if (w.Stripe) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Stripe.js'));
    document.head.appendChild(script);
  });
}
