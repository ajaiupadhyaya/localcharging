/** Deterministic coordinate fuzz matching Postgres fuzz_coordinate logic (client-side preview). */
export function fuzzCoordinate(
  lng: number,
  lat: number,
  seed: string,
): { lng: number; lat: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const angle = (absHash % 360) * (Math.PI / 180);
  const distanceM = 150 + (absHash % 151);

  const earthRadius = 6378137;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  const newLat =
    Math.asin(
      Math.sin(latRad) * Math.cos(distanceM / earthRadius) +
        Math.cos(latRad) * Math.sin(distanceM / earthRadius) * Math.cos(angle),
    ) *
    (180 / Math.PI);

  const newLng =
    lngRad +
    Math.atan2(
      Math.sin(angle) * Math.sin(distanceM / earthRadius) * Math.cos(latRad),
      Math.cos(distanceM / earthRadius) - Math.sin(latRad) * Math.sin((newLat * Math.PI) / 180),
    );

  return {
    lng: (newLng * 180) / Math.PI,
    lat: newLat,
  };
}

export function stripStreetNumber(address: string): string {
  return address.replace(/^\d+\s*/, '').trim();
}
