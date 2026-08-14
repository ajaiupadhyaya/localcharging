import { describe, expect, it } from 'vitest';
import { canSeePrivateLocation, canTransition, isTerminalStatus } from './stateMachine';

/**
 * Documents the integration loop the RPCs enforce.
 * Live RPC coverage: supabase/tests/rls_privacy.sql + manual two-browser walkthrough.
 */
describe('booking loop contract', () => {
  it('follows request → approve → arrive → charge → complete', () => {
    expect(canTransition('requested', 'approved')).toBe(true);
    expect(canTransition('approved', 'arriving')).toBe(true);
    expect(canTransition('arriving', 'checked_in')).toBe(true);
    expect(canTransition('checked_in', 'charging')).toBe(true);
    expect(canTransition('charging', 'completed')).toBe(true);
    expect(isTerminalStatus('completed')).toBe(true);
  });

  it('allows cancel and no-show without revealing after cancel', () => {
    expect(canTransition('requested', 'cancelled')).toBe(true);
    expect(canTransition('approved', 'cancelled')).toBe(true);
    expect(canTransition('approved', 'no_show')).toBe(true);
    expect(canSeePrivateLocation('cancelled')).toBe(false);
    expect(canSeePrivateLocation('approved')).toBe(true);
  });
});
