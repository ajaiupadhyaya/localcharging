import { supabase } from '@/lib/auth/supabase';
import type { MapCharger, StationSearchParams } from '@/types';
import type { ChargerProvider } from './types';

export class ChargeLocalProvider implements ChargerProvider {
  providerId = 'chargelocal';

  async searchStations(params: StationSearchParams) {
    return fetchNearbyChargers(params.lng, params.lat, {
      residentialOnly: true,
      radiusM: params.radiusM,
    }) as Promise<any>;
  }

  async getStation(_stationId: string) {
    return null;
  }
}

export async function fetchNearbyChargers(
  lng: number,
  lat: number,
  options?: {
    radiusM?: number;
    residentialOnly?: boolean;
    availableOnly?: boolean;
  },
): Promise<MapCharger[]> {
  const { data, error } = await supabase.rpc('nearby_chargers', {
    p_lng: lng,
    p_lat: lat,
    p_radius_m: options?.radiusM ?? 15000,
    p_residential_only: options?.residentialOnly ?? false,
    p_available_only: options?.availableOnly ?? false,
  });

  if (error) throw error;
  return (data ?? []) as MapCharger[];
}

export async function fetchChargerDetail(chargerId: string, userId?: string) {
  const { data, error } = await supabase.rpc('get_charger_detail', {
    p_charger_id: chargerId,
    p_user_id: userId ?? null,
  });
  if (error) throw error;
  return data;
}
