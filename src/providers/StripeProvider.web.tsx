import React from 'react';

/** Web: Stripe native SDK is not available — payments deferred to native or Stripe.js later. */
export function StripeProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
