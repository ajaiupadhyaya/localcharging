import { describe, expect, it } from 'vitest';
import { fuzzCoordinate, stripStreetNumber } from '@/lib/privacy/fuzzCoordinate';

describe('privacy', () => {
  it('fuzz is deterministic for same seed', () => {
    const a = fuzzCoordinate(-78.4767, 38.0293, 'seed-123');
    const b = fuzzCoordinate(-78.4767, 38.0293, 'seed-123');
    expect(a.lng).toBeCloseTo(b.lng, 5);
    expect(a.lat).toBeCloseTo(b.lat, 5);
  });

  it('fuzz differs for different seeds', () => {
    const a = fuzzCoordinate(-78.4767, 38.0293, 'seed-a');
    const b = fuzzCoordinate(-78.4767, 38.0293, 'seed-b');
    const distance = Math.hypot(a.lng - b.lng, a.lat - b.lat);
    expect(distance).toBeGreaterThan(0.00001);
  });

  it('strips street number from address', () => {
    expect(stripStreetNumber('123 Main St')).toBe('Main St');
  });
});
