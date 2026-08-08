import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DEFAULT_MAP_CENTER } from '@/constants/theme';
import type { MapCanvasProps, MapRegion } from './MapCanvas.types';

export type { MapRegion } from './MapCanvas.types';

const REGION_EPS = 1e-5;
const ZOOM_EPS = 1e-3;

function regionDiffers(a: MapRegion, b: MapRegion) {
  return (
    Math.abs(a.lng - b.lng) > REGION_EPS ||
    Math.abs(a.lat - b.lat) > REGION_EPS ||
    Math.abs(a.zoom - b.zoom) > ZOOM_EPS
  );
}

export function MapCanvas(props: MapCanvasProps) {
  const { chargers, selectedId, region, onRegionChange, onSelectCharger } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const skipMoveEndRef = useRef(false);
  const onRegionChangeRef = useRef(onRegionChange);
  const chargersRef = useRef(chargers);
  const onSelectChargerRef = useRef(onSelectCharger);
  const [styleReady, setStyleReady] = useState(false);

  onRegionChangeRef.current = onRegionChange;
  chargersRef.current = chargers;
  onSelectChargerRef.current = onSelectCharger;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    require('mapbox-gl/dist/mapbox-gl.css');
    const mapboxgl = require('mapbox-gl');
    mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [region.lng, region.lat],
      zoom: region.zoom,
    });
    map.on('load', () => setStyleReady(true));
    map.on('moveend', () => {
      if (skipMoveEndRef.current) {
        skipMoveEndRef.current = false;
        return;
      }
      const c = map.getCenter();
      onRegionChangeRef.current?.({ lng: c.lng, lat: c.lat, zoom: map.getZoom() });
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const current: MapRegion = {
      lng: map.getCenter().lng,
      lat: map.getCenter().lat,
      zoom: map.getZoom(),
    };
    if (!regionDiffers(current, region)) return;
    skipMoveEndRef.current = true;
    map.jumpTo({ center: [region.lng, region.lat], zoom: region.zoom });
  }, [region, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    const geojson = {
      type: 'FeatureCollection',
      features: chargers.map((c) => ({
        type: 'Feature',
        properties: { id: c.id, source: c.source, selected: c.id === selectedId },
        geometry: { type: 'Point', coordinates: [c.public_lng, c.public_lat] },
      })),
    };

    if (map.getSource('chargers')) {
      map.getSource('chargers').setData(geojson);
      return;
    }

    map.addSource('chargers', { type: 'geojson', data: geojson, cluster: true, clusterRadius: 40 });
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'chargers',
      filter: ['has', 'point_count'],
      paint: { 'circle-color': '#4F46E5', 'circle-radius': 18 },
    });
    map.addLayer({
      id: 'unclustered',
      type: 'circle',
      source: 'chargers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['case', ['==', ['get', 'source'], 'public'], '#8A8F98', '#4F46E5'],
        'circle-radius': ['case', ['get', 'selected'], 14, 10],
      },
    });
    map.on('click', 'unclustered', (e: any) => {
      const id = e.features?.[0]?.properties?.id;
      const charger = chargersRef.current.find((c) => c.id === id);
      if (charger) onSelectChargerRef.current?.(charger);
    });
  }, [chargers, selectedId, styleReady]);

  return (
    <View style={styles.fill}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

export function useDefaultRegion(): MapRegion {
  return { lng: DEFAULT_MAP_CENTER.lng, lat: DEFAULT_MAP_CENTER.lat, zoom: DEFAULT_MAP_CENTER.zoom };
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
