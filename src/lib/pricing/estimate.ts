import type { PricingInput, PricingResult } from '@/types';

export function estimateEnergyKwh(
  batteryCapacityKwh: number,
  startSoc: number,
  targetSoc: number,
): number {
  const delta = Math.max(0, targetSoc - startSoc) / 100;
  return Math.round(batteryCapacityKwh * delta * 10) / 10;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const rate = input.platformFeeRate ?? 0.12;
  let subtotal = 0;

  switch (input.pricingType) {
    case 'free':
      subtotal = 0;
      break;
    case 'per_kwh':
      subtotal = (input.pricePerKwh ?? 0) * (input.requestedKwh ?? 0);
      break;
    case 'per_session':
      subtotal = input.pricePerSession ?? 0;
      break;
    case 'per_hour':
      subtotal = (input.pricePerHour ?? 0) * (input.durationHours ?? 1);
      break;
  }

  subtotal = Math.round(subtotal * 100) / 100;
  const platformFee = Math.round(subtotal * rate * 100) / 100;
  const total = Math.round((subtotal + platformFee) * 100) / 100;
  const hostAmount = Math.round((subtotal - subtotal * rate) * 100) / 100;

  return { subtotal, platformFee, total, hostAmount };
}

export function formatPrice(
  pricingType: PricingInput['pricingType'],
  values: Pick<PricingInput, 'pricePerKwh' | 'pricePerSession' | 'pricePerHour'>,
): string {
  switch (pricingType) {
    case 'free':
      return '$0';
    case 'per_kwh':
      return `$${(values.pricePerKwh ?? 0).toFixed(2)} / kWh`;
    case 'per_session':
      return `$${(values.pricePerSession ?? 0).toFixed(0)} / session`;
    case 'per_hour':
      return `$${(values.pricePerHour ?? 0).toFixed(0)} / hour`;
    default:
      return '';
  }
}
