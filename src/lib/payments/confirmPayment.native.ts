import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

export async function confirmBookingPayment(clientSecret: string): Promise<void> {
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'ChargeLocal',
  });
  if (initError) throw new Error(initError.message);
  const { error } = await presentPaymentSheet();
  if (error) throw new Error(error.message);
}
