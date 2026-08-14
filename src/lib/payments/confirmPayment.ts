export async function confirmBookingPayment(_clientSecret: string): Promise<void> {
  throw new Error('Payment confirmation is only available on iOS, Android, or web.');
}
