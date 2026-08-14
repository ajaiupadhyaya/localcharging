import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { MapCanvas, useDefaultRegion, type MapRegion } from '@/components/map/MapCanvas';
import { ChargerDetailSheet } from '@/components/map/ChargerDetailSheet';
import { MapFiltersBar } from '@/components/map/MapFilters';
import { TextField } from '@/components/ui/TextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, typography } from '@/constants/theme';
import { useNearbyChargers } from '@/hooks/useNearbyChargers';
import { geocodeSearch } from '@/lib/maps/geocoding';
import { AnalyticsEvents, track } from '@/lib/analytics/events';
import type { MapCharger, MapFilters } from '@/types';

export function MapShell() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [region, setRegion] = useState<MapRegion>(useDefaultRegion());
  const [selected, setSelected] = useState<MapCharger | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MapFilters>({ category: 'any' });
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);

  const debouncedRegion = useDebounced(region, 400);
  const { data: chargers = [], isLoading, isError, refetch } = useNearbyChargers(
    debouncedRegion.lng,
    debouncedRegion.lat,
    filters,
  );

  useEffect(() => {
    track(AnalyticsEvents.MAP_OPENED);
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ lng: loc.coords.longitude, lat: loc.coords.latitude });
      setRegion((r) => ({ ...r, lng: loc.coords.longitude, lat: loc.coords.latitude, zoom: 12 }));
    })();
  }, []);

  const onSearchSubmit = useCallback(async () => {
    if (!search.trim()) return;
    track(AnalyticsEvents.SEARCH_PERFORMED, { query_length: search.length });
    const result = await geocodeSearch(search);
    if (result) setRegion({ lng: result.lng, lat: result.lat, zoom: 12 });
  }, [search]);

  const countLabel = useMemo(() => {
    if (isLoading) return 'Loading chargers…';
    return `${chargers.length} charger${chargers.length === 1 ? '' : 's'} nearby`;
  }, [chargers.length, isLoading]);

  return (
    <View style={styles.root}>
      <View style={[styles.mapArea, isWide && styles.mapAreaWide]}>
        <View style={styles.topChrome} pointerEvents="box-none">
          <Text style={styles.logo}>ChargeLocal</Text>
          <View style={styles.searchWrap}>
            <TextField
              placeholder="Where are you going?"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={onSearchSubmit}
              returnKeyType="search"
              style={styles.searchInput}
            />
          </View>
          <MapFiltersBar
            filters={filters}
            onChange={(next) => {
              setFilters(next);
              track(AnalyticsEvents.FILTER_USED, { category: next.category });
            }}
          />
          <View style={styles.countPill}>
            {isLoading ? <ActivityIndicator size="small" color={colors.warmWhite} /> : null}
            <Text style={styles.countText}>{countLabel}</Text>
          </View>
          {isError ? (
            <Text style={styles.errorText} onPress={() => refetch()}>
              Couldn't update availability. Tap to retry.
            </Text>
          ) : null}
        </View>
        <MapCanvas
          chargers={chargers}
          selectedId={selected?.id}
          region={region}
          onRegionChange={(next) => {
            setRegion((prev) =>
              Math.abs(prev.lng - next.lng) > 1e-5 ||
              Math.abs(prev.lat - next.lat) > 1e-5 ||
              Math.abs(prev.zoom - next.zoom) > 1e-3
                ? next
                : prev,
            );
          }}
          onSelectCharger={(c) => {
            setSelected(c);
            track(AnalyticsEvents.CHARGER_VIEWED, { source: c.source });
          }}
          userLocation={userLocation}
        />
      </View>
      {!isLoading && chargers.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="box-none">
          <EmptyState
            title="No chargers here yet."
            description="Try expanding the search or add your own charger."
            actionLabel="Host a charger"
            onAction={() => router.push('/host/onboarding')}
          />
        </View>
      ) : null}
      {(selected || isWide) && (
        <View style={[styles.detailPanel, isWide && styles.detailPanelWide]}>
          {Platform.OS !== 'web' && !isWide ? null : null}
          <ChargerDetailSheet charger={selected} onClose={() => setSelected(null)} />
        </View>
      )}
    </View>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.graphite },
  mapArea: { flex: 1 },
  mapAreaWide: { flex: 2 },
  topChrome: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 16 : 56,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  logo: { ...typography.title, color: colors.warmWhite, fontWeight: '700' },
  searchWrap: {},
  searchInput: { backgroundColor: 'rgba(247,246,243,0.95)' },
  countPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,21,24,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: { ...typography.caption, color: colors.warmWhite },
  errorText: { ...typography.caption, color: colors.warning },
  emptyOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    backgroundColor: 'rgba(247,246,243,0.96)',
    borderRadius: 16,
  },
  detailPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  detailPanelWide: {
    position: 'relative',
    flex: 1,
    maxWidth: 420,
    backgroundColor: colors.warmWhite,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
});
