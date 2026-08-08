export async function geocodeSearch(query: string): Promise<{ lng: number; lat: number; placeName: string } | null> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const feature = json.features?.[0];
  if (!feature) return null;
  const [lng, lat] = feature.center;
  return { lng, lat, placeName: feature.place_name };
}
