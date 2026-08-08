import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchNearbyChargers } from '@/lib/providers/chargeLocalProvider';
import type { MapCharger, MapFilters } from '@/types';

function applyMapFilters(data: MapCharger[], filters: MapFilters): MapCharger[] {
  let result = data;
  if (filters.category === 'public') {
    result = result.filter((c) => c.source === 'public');
  } else if (filters.category === 'residential') {
    result = result.filter((c) => c.source === 'residential');
  } else if (filters.category === 'fast') {
    result = result.filter((c) => c.max_kw >= 50);
  } else if (filters.category === 'available') {
    result = result.filter((c) =>
      ['available', 'request_required'].includes(c.availability_state),
    );
  }
  if (filters.connector) {
    result = result.filter((c) => c.connector_type === filters.connector);
  }
  if (filters.instantApproval) {
    result = result.filter((c) => c.approval_mode === 'automatic');
  }
  return result;
}

export function useNearbyChargers(
  lng: number | null,
  lat: number | null,
  filters: MapFilters,
) {
  const query = useQuery({
    queryKey: ['nearby-chargers', lng, lat, filters],
    queryFn: () => {
      if (lng == null || lat == null) return Promise.resolve([]);
      return fetchNearbyChargers(lng, lat, {
        residentialOnly: filters.category === 'residential',
        availableOnly: filters.category === 'available' || filters.instantApproval === true,
      });
    },
    enabled: lng != null && lat != null,
    staleTime: filters.category === 'available' ? 15_000 : 30_000,
  });

  const data = useMemo(
    () => applyMapFilters(query.data ?? [], filters),
    [query.data, filters],
  );

  return { ...query, data };
}

export function useChargerDetail(chargerId: string | null, userId?: string) {
  return useQuery({
    queryKey: ['charger', chargerId, userId],
    queryFn: async () => {
      const { fetchChargerDetail } = await import('@/lib/providers/chargeLocalProvider');
      return fetchChargerDetail(chargerId!, userId);
    },
    enabled: Boolean(chargerId),
  });
}
