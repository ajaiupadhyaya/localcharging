export interface WeeklySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

function parseTime(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function windowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isWithinWeeklyHours(start: Date, end: Date, slots: WeeklySlot[]): boolean {
  if (!slots.length) return true;
  const day = start.getDay();
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  return slots.some((slot) => {
    if (!slot.enabled || slot.day_of_week !== day) return false;
    return startMin >= parseTime(slot.start_time) && endMin <= parseTime(slot.end_time);
  });
}
