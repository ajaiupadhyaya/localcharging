#!/usr/bin/env node
/**
 * Story seed: demo driver/host + Alex / Maya / Jordan / Chris listings.
 * Requires EXPO_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY will fail).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const DEMO_PASSWORD = 'ChargeLocalDemo1!';
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: 'driver@chargelocal.test', name: 'Demo Driver', role: 'driver' },
  { email: 'host@chargelocal.test', name: 'Alex', role: 'both' },
  { email: 'maya@chargelocal.test', name: 'Maya', role: 'both' },
  { email: 'jordan@chargelocal.test', name: 'Jordan', role: 'both' },
  { email: 'chris@chargelocal.test', name: 'Chris', role: 'both' },
];

const LISTINGS = [
  {
    email: 'host@chargelocal.test',
    name: "Alex's Home Charger",
    address: '812 Levy Ave, Charlottesville, VA',
    lng: -78.4774,
    lat: 38.0251,
    connector: 'j1772',
    maxKw: 11.5,
    parkingType: 'driveway',
    parking: 'Pull into the right side of the driveway. Outdoor charger on the wall.',
    access: 'Side gate latch — lift and push.',
    approval: 'manual',
    pricingType: 'per_kwh',
    pricePerKwh: 0.18,
    neighborhood: 'Belmont',
    hours: { start: '17:00', end: '21:00', days: [1, 2, 3, 4, 5] },
  },
  {
    email: 'maya@chargelocal.test',
    name: "Maya's NACS",
    address: '209 Shamrock Rd, Charlottesville, VA',
    lng: -78.4948,
    lat: 38.0264,
    connector: 'nacs',
    maxKw: 11.5,
    parkingType: 'driveway',
    parking: 'Park beside the gray Civic. Charger on the left post.',
    access: null,
    approval: 'automatic',
    pricingType: 'free',
    pricePerKwh: null,
    neighborhood: "Fry's Spring",
    hours: { start: '08:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    email: 'jordan@chargelocal.test',
    name: "Jordan's Fan District",
    address: '1814 Hanover Ave, Richmond, VA',
    lng: -77.4602,
    lat: 37.5531,
    connector: 'j1772',
    maxKw: 7.2,
    parkingType: 'street_adjacent',
    parking: 'Street spot in front of the brick row house. Cone marks the stall.',
    access: null,
    approval: 'manual',
    pricingType: 'per_session',
    pricePerSession: 5,
    neighborhood: 'The Fan',
    hours: { start: '18:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] },
  },
  {
    email: 'chris@chargelocal.test',
    name: "Chris · Navy Yard",
    address: '1201 4th St SE, Washington, DC',
    lng: -77.0018,
    lat: 38.8762,
    connector: 'j1772',
    maxKw: 11.5,
    parkingType: 'garage',
    parking: 'Assigned outdoor stall B3. Do not enter the building.',
    access: 'Call box: 14# then wait for the click.',
    approval: 'manual',
    pricingType: 'per_kwh',
    pricePerKwh: 0.22,
    neighborhood: 'Navy Yard',
    hours: { start: '19:00', end: '23:00', days: [1, 2, 3, 4, 5] },
  },
];

async function ensureUser(email, name) {
  const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
  const found = existing?.users?.find((u) => u.email === email);
  if (found) return found.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const { error: stationsError } = await admin.from('public_stations').upsert(
    [
      {
        provider: 'demo',
        provider_station_id: 'dc-fast-1',
        name: 'Demo DC Fast · 250 kW',
        location: 'SRID=4326;POINT(-77.0369 38.9072)',
        address: 'Washington, DC',
        connector_types: ['ccs'],
        max_kw: 250,
        status: 'available',
        operator: 'Demo Network',
      },
      {
        provider: 'demo',
        provider_station_id: 'dc-fast-2',
        name: 'Demo DC Fast · 150 kW',
        location: 'SRID=4326;POINT(-77.4340 37.5407)',
        address: 'Richmond, VA',
        connector_types: ['ccs'],
        max_kw: 150,
        status: 'unknown',
        operator: 'Demo Network',
      },
      {
        provider: 'demo',
        provider_station_id: 'cville-l2',
        name: 'Demo Level 2 · Downtown',
        location: 'SRID=4326;POINT(-78.4767 38.0293)',
        address: 'Charlottesville, VA',
        connector_types: ['j1772'],
        max_kw: 11,
        status: 'available',
        operator: 'Demo Network',
      },
    ],
    { onConflict: 'provider,provider_station_id' },
  );
  if (stationsError) console.warn('public_stations upsert:', stationsError.message);

  const ids = {};
  for (const u of USERS) {
    ids[u.email] = await ensureUser(u.email, u.name);
    await admin.from('profiles').update({ display_name: u.name, role: u.role, email_verified: true }).eq('id', ids[u.email]);
    console.log('user', u.email, ids[u.email]);
  }

  const driverId = ids['driver@chargelocal.test'];
  await admin.from('vehicles').delete().eq('user_id', driverId);
  await admin.from('vehicles').insert({
    user_id: driverId,
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    connector_types: ['nacs', 'j1772'],
    battery_capacity_kwh: 75,
    nickname: 'Daily',
  });

  for (const listing of LISTINGS) {
    const hostId = ids[listing.email];
    const { data: existing } = await admin.from('chargers').select('id').eq('host_id', hostId).eq('name', listing.name).maybeSingle();
    let chargerId = existing?.id;
    if (!chargerId) {
      const { data, error } = await admin.rpc('create_charger_listing', {
        p_name: listing.name,
        p_exact_address: listing.address,
        p_lng: listing.lng,
        p_lat: listing.lat,
        p_connector: listing.connector,
        p_max_kw: listing.maxKw,
        p_parking_type: listing.parkingType,
        p_parking_instructions: listing.parking,
        p_access_instructions_private: listing.access,
        p_approval_mode: listing.approval,
        p_pricing_type: listing.pricingType,
        p_price_per_kwh: listing.pricePerKwh ?? null,
        p_neighborhood: listing.neighborhood,
        p_price_per_session: listing.pricePerSession ?? null,
        p_price_per_hour: null,
        p_photos: [],
        p_arrival_instructions: listing.parking,
      });
      // RPC uses auth.uid() — service role has no uid. Insert directly instead.
      if (error || !data) {
        const fuzz = await admin.rpc('fuzz_coordinate', { p_lng: listing.lng, p_lat: listing.lat, p_seed: hostId });
        const row = {
          host_id: hostId,
          name: listing.name,
          exact_address: listing.address,
          location: `SRID=4326;POINT(${listing.lng} ${listing.lat})`,
          public_location: fuzz.data ?? `SRID=4326;POINT(${listing.lng + 0.002} ${listing.lat + 0.002})`,
          connector_type: listing.connector,
          level: listing.maxKw >= 50 ? 'dc_fast' : 'level_2',
          max_kw: listing.maxKw,
          parking_type: listing.parkingType,
          parking_instructions: listing.parking,
          access_instructions_private: listing.access,
          arrival_instructions: listing.parking,
          approval_mode: listing.approval,
          pricing_type: listing.pricingType,
          price_per_kwh: listing.pricePerKwh ?? null,
          price_per_session: listing.pricePerSession ?? null,
          neighborhood: listing.neighborhood,
          availability_state: listing.approval === 'automatic' ? 'available' : 'request_required',
          status: 'active',
        };
        const inserted = await admin.from('chargers').insert(row).select('id').single();
        if (inserted.error) {
          console.error('charger insert failed', listing.name, inserted.error.message);
          continue;
        }
        chargerId = inserted.data.id;
      } else {
        chargerId = data;
      }
    }

    await admin.from('charger_availability').delete().eq('charger_id', chargerId);
    await admin.from('charger_availability').insert(
      listing.hours.days.map((day) => ({
        charger_id: chargerId,
        day_of_week: day,
        start_time: listing.hours.start,
        end_time: listing.hours.end,
        enabled: true,
      })),
    );
    console.log('listing', listing.name, chargerId);
  }

  console.log('\nDemo accounts (password ChargeLocalDemo1!)');
  console.log('  driver@chargelocal.test');
  console.log('  host@chargelocal.test  (Alex · Belmont)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
