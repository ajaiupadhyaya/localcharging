import React from 'react';

/** Web uses Stripe.js in confirmPayment.web.ts (test PaymentMethod pm_card_visa). */
export function StripeProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
