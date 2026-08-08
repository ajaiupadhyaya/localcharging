import { describe, expect, it } from 'vitest';
import { calculatePricing, estimateEnergyKwh, formatPrice } from '@/lib/pricing/estimate';

describe('pricing', () => {
  it('estimates energy from SOC delta', () => {
    expect(estimateEnergyKwh(75, 24, 80)).toBeCloseTo(42, 0);
  });

  it('calculates per-kWh with platform fee', () => {
    const result = calculatePricing({
      pricingType: 'per_kwh',
      pricePerKwh: 0.18,
      requestedKwh: 38,
      platformFeeRate: 0.12,
    });
    expect(result.subtotal).toBeCloseTo(6.84, 2);
    expect(result.total).toBeGreaterThan(result.subtotal);
  });

  it('formats free pricing', () => {
    expect(formatPrice('free', {})).toBe('$0');
  });
});
