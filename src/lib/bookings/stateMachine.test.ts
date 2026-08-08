import { describe, expect, it } from 'vitest';
import { canTransition, canSeePrivateLocation, bookingStatusLabel } from '@/lib/bookings/stateMachine';

describe('booking state machine', () => {
  it('allows requested -> approved', () => {
    expect(canTransition('requested', 'approved')).toBe(true);
  });

  it('blocks requested -> charging', () => {
    expect(canTransition('requested', 'charging')).toBe(false);
  });

  it('reveals private location after approval', () => {
    expect(canSeePrivateLocation('approved')).toBe(true);
    expect(canSeePrivateLocation('requested')).toBe(false);
  });

  it('labels statuses in human language', () => {
    expect(bookingStatusLabel('requested')).toBe('Waiting for approval');
    expect(bookingStatusLabel('approved')).toBe("You're approved");
  });
});
