import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { DEFAULT_MAP_CENTER } from '@/constants/theme';
import type { MapCanvasProps, MapRegion } from './MapCanvas.types';

export type { MapRegion } from './MapCanvas.types';

export function MapCanvas(props: MapCanvasProps) {
  const Mapbox = require('@rnmapbox/maps');
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (token) Mapbox.setAccessToken(token);

  const { chargers, selectedId, region, onRegionChange, onSelectCharger, userLocation } = props;
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: [region.lng, region.lat],
      zoomLevel: region.zoom,
      animationDuration: 300,
    });
  }, [region.lng, region.lat, region.zoom]);

  const geojson = {
    type: 'FeatureCollection',
    features: chargers.map((c) => ({
      type: 'Feature',
      id: c.id,
      properties: {
        id: c.id,
        source: c.source,
        selected: c.id === selectedId,
        available: ['available', 'request_required'].includes(c.availability_state),
      },
      geometry: { type: 'Point', coordinates: [c.public_lng, c.public_lat] },
    })),
  };

  return (
    <View style={styles.fill}>
      <Mapbox.MapView
        style={styles.fill}
        styleURL={Mapbox.StyleURL.Dark}
        onCameraChanged={(e: any) => {
          const c = e.properties.center;
          onRegionChange?.({ lng: c[0], lat: c[1], zoom: e.properties.zoom });
        }}
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [region.lng, region.lat], zoomLevel: region.zoom }}
        />
        {userLocation ? (
          <Mapbox.PointAnnotation id="user" coordinate={[userLocation.lng, userLocation.lat]}>
            <View style={styles.userDot} />
          </Mapbox.PointAnnotation>
        ) : null}
        <Mapbox.ShapeSource
          id="chargers"
          shape={geojson}
          cluster
          clusterRadius={40}
          onPress={(e: any) => {
            const feature = e.features?.[0];
            if (!feature?.properties?.id) return;
            const charger = chargers.find((c) => c.id === feature.properties.id);
            if (charger) onSelectCharger?.(charger);
          }}
        >
          <Mapbox.CircleLayer
            id="clustered"
            filter={['has', 'point_count']}
            style={{ circleColor: '#4F46E5', circleRadius: 18, circleOpacity: 0.85 }}
          />
          <Mapbox.SymbolLayer
            id="clusterCount"
            filter={['has', 'point_count']}
            style={{ textField: ['get', 'point_count_abbreviated'], textSize: 12, textColor: '#fff' }}
          />
          <Mapbox.CircleLayer
            id="unclustered"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: ['case', ['==', ['get', 'source'], 'public'], '#8A8F98', '#4F46E5'],
              circleRadius: ['case', ['get', 'selected'], 14, 10],
              circleStrokeWidth: ['case', ['get', 'available'], 2, 0],
              circleStrokeColor: '#F7F6F3',
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>
    </View>
  );
}

export function useDefaultRegion(): MapRegion {
  return { lng: DEFAULT_MAP_CENTER.lng, lat: DEFAULT_MAP_CENTER.lat, zoom: DEFAULT_MAP_CENTER.zoom };
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
