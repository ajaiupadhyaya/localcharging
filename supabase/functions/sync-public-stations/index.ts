// Open Charge Map sync — run on schedule via Supabase cron
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const BBOX = {
  minLat: 37.4,
  maxLat: 39.2,
  minLng: -78.8,
  maxLng: -76.5,
};

Deno.serve(async (req) => {
  const ocmKey = Deno.env.get('OPEN_CHARGE_MAP_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  if (!ocmKey) {
    return new Response(JSON.stringify({ error: 'OCM key not configured' }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const url = `https://api.openchargemap.io/v3/poi/?output=json&boundingbox=${BBOX.minLat},${BBOX.minLng},${BBOX.maxLat},${BBOX.maxLng}&maxresults=200&key=${ocmKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'OCM fetch failed' }), { status: 502 });
  }
  const pois = await res.json();

  let synced = 0;
  for (const poi of pois) {
    const lat = poi.AddressInfo?.Latitude;
    const lng = poi.AddressInfo?.Longitude;
    if (lat == null || lng == null) continue;

    const connectors = poi.Connections ?? [];
    const maxKw = Math.max(0, ...connectors.map((c: { PowerKW?: number }) => c.PowerKW ?? 0));

    const { error } = await supabase.from('public_stations').upsert(
      {
        provider: 'open_charge_map',
        provider_station_id: String(poi.ID),
        name: poi.AddressInfo?.Title ?? 'Public charger',
        location: `SRID=4326;POINT(${lng} ${lat})`,
        address: poi.AddressInfo?.AddressLine1 ?? null,
        connector_types: ['j1772'],
        max_kw: maxKw || null,
        status: 'unknown',
        operator: poi.OperatorInfo?.Title ?? null,
        raw_provider_data: poi,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'provider,provider_station_id' },
    );
    if (!error) synced++;
  }

  return new Response(JSON.stringify({ synced, attribution: 'Open Charge Map' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
