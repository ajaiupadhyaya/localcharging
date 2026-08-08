import type { Station, StationSearchParams } from '@/types';
import type { ChargerProvider } from './types';
import { mapOcmConnector, normalizeAvailability } from './types';

/** Client reads cached public_stations only — never calls OCM directly. */
export class OpenChargeMapProvider implements ChargerProvider {
  providerId = 'open_charge_map';

  async searchStations(_params: StationSearchParams): Promise<Station[]> {
    return [];
  }

  async getStation(_stationId: string): Promise<Station | null> {
    return null;
  }

  static normalizePoi(poi: Record<string, unknown>): Partial<Station> {
    const info = poi.AddressInfo as Record<string, unknown> | undefined;
    const connections = (poi.Connections as Array<Record<string, unknown>>) ?? [];
    return {
      sourceId: String(poi.ID),
      name: String(info?.Title ?? 'Public charger'),
      latitude: Number(info?.Latitude),
      longitude: Number(info?.Longitude),
      address: String(info?.AddressLine1 ?? ''),
      connectors: connections.map((c) => ({
        type: mapOcmConnector(String((c.ConnectionType as { Title?: string })?.Title ?? '')),
        powerKw: Number(c.PowerKW),
      })),
      availability: normalizeAvailability(String((poi.StatusType as { Title?: string })?.Title ?? '')),
      operator: String((poi.OperatorInfo as Record<string, unknown>)?.Title ?? ''),
    };
  }
}
