export interface GeocodeResult {
  lng: number;
  lat: number;
  placeName: string;
  neighborhood?: string;
  address?: string;
}

export async function geocodeSearch(query: string): Promise<GeocodeResult | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1&types=address,neighborhood,place,locality`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.center;
  const context = (feature.context ?? []) as { id: string; text: string }[];
  const neighborhood =
    context.find((c) => c.id.startsWith('neighborhood'))?.text ??
    context.find((c) => c.id.startsWith('locality'))?.text ??
    context.find((c) => c.id.startsWith('place'))?.text;
  return {
    lng,
    lat,
    placeName: feature.place_name,
    neighborhood,
    address: feature.place_name,
  };
}
