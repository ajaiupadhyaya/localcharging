import type { BookingStatus } from '@/types';

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  requested: ['approved', 'declined', 'expired', 'cancelled'],
  approved: ['arriving', 'cancelled', 'no_show'],
  declined: [],
  expired: [],
  cancelled: [],
  arriving: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['charging', 'cancelled'],
  charging: ['completed', 'interrupted'],
  interrupted: [],
  completed: [],
  no_show: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalStatus(status: BookingStatus): boolean {
  return ['declined', 'expired', 'cancelled', 'completed', 'interrupted', 'no_show'].includes(
    status,
  );
}

export function canSeePrivateLocation(status: BookingStatus): boolean {
  return ['approved', 'arriving', 'checked_in', 'charging', 'completed'].includes(status);
}

export function bookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    requested: 'Waiting for approval',
    approved: "You're approved",
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled',
    arriving: 'On your way',
    checked_in: 'Checked in',
    charging: 'Charging',
    interrupted: 'Interrupted',
    completed: 'Completed',
    no_show: 'No show',
  };
  return labels[status];
}
