import type { MapCharger } from '@/types';

export interface MapRegion {
  lng: number;
  lat: number;
  zoom: number;
}

export interface MapCanvasProps {
  chargers: MapCharger[];
  selectedId?: string | null;
  region: MapRegion;
  onRegionChange?: (region: MapRegion) => void;
  onSelectCharger?: (charger: MapCharger) => void;
  userLocation?: { lng: number; lat: number } | null;
}
