import { describe, expect, it } from 'vitest';
import { isWithinWeeklyHours, windowsOverlap } from './overlap';

describe('availability overlap', () => {
  it('detects overlapping windows', () => {
    const a = new Date('2026-08-10T18:00:00');
    const b = new Date('2026-08-10T20:00:00');
    const c = new Date('2026-08-10T19:00:00');
    const d = new Date('2026-08-10T21:00:00');
    expect(windowsOverlap(a, b, c, d)).toBe(true);
    expect(windowsOverlap(a, b, new Date('2026-08-10T20:00:00'), d)).toBe(false);
  });

  it('allows any time when no weekly slots exist', () => {
    const start = new Date('2026-08-10T02:00:00');
    const end = new Date('2026-08-10T04:00:00');
    expect(isWithinWeeklyHours(start, end, [])).toBe(true);
  });

  it('rejects times outside weekday evenings', () => {
    const slots = [{ day_of_week: 1, start_time: '17:00', end_time: '21:00', enabled: true }];
    const mondayEvening = new Date('2026-08-10T18:00:00');
    const mondayLate = new Date('2026-08-10T20:00:00');
    const mondayMorning = new Date('2026-08-10T09:00:00');
    const mondayNoon = new Date('2026-08-10T11:00:00');
    expect(isWithinWeeklyHours(mondayEvening, mondayLate, slots)).toBe(true);
    expect(isWithinWeeklyHours(mondayMorning, mondayNoon, slots)).toBe(false);
  });
});
