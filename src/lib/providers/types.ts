import type { AvailabilityState, Connector, Station, StationSearchParams } from '@/types';

export interface ChargerProvider {
  providerId: string;
  searchStations(params: StationSearchParams): Promise<Station[]>;
  getStation(stationId: string): Promise<Station | null>;
}

export interface Tariff {
  summary: string;
}

export interface StartSessionParams {
  stationId: string;
  userId: string;
}

export interface ReservationParams {
  stationId: string;
  start: Date;
  end: Date;
}

export function normalizeAvailability(raw?: string | null): AvailabilityState {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('available') || lower === 'operational') return 'available';
  if (lower.includes('charging') || lower.includes('in use')) return 'charging';
  if (lower.includes('offline') || lower.includes('fault')) return 'offline';
  return 'unknown';
}

export function mapOcmConnector(typeTitle?: string): Connector['type'] {
  const t = (typeTitle ?? '').toLowerCase();
  if (t.includes('nacs') || t.includes('j3400') || t.includes('tesla')) return 'nacs';
  if (t.includes('ccs')) return 'ccs';
  if (t.includes('chademo')) return 'chademo';
  if (t.includes('j1772') || t.includes('type 1')) return 'j1772';
  return 'other';
}
