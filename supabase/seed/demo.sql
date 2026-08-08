-- Demo seed for Charlottesville / Richmond / DC corridor
-- Run after auth users exist, or use service role to insert test profiles

-- Example public stations (demo fixtures when OCM not synced)
INSERT INTO public_stations (provider, provider_station_id, name, location, address, connector_types, max_kw, status, operator)
VALUES
  ('demo', 'dc-fast-1', 'Demo DC Fast · 250 kW', ST_SetSRID(ST_MakePoint(-77.0369, 38.9072), 4326)::geography, 'Washington, DC', ARRAY['ccs']::connector_type[], 250, 'available', 'Demo Network'),
  ('demo', 'dc-fast-2', 'Demo DC Fast · 150 kW', ST_SetSRID(ST_MakePoint(-77.4340, 37.5407), 4326)::geography, 'Richmond, VA', ARRAY['ccs']::connector_type[], 150, 'unknown', 'Demo Network'),
  ('demo', 'cville-l2', 'Demo Level 2 · Downtown', ST_SetSRID(ST_MakePoint(-78.4767, 38.0293), 4326)::geography, 'Charlottesville, VA', ARRAY['j1772']::connector_type[], 11, 'available', 'Demo Network')
ON CONFLICT (provider, provider_station_id) DO NOTHING;

-- Note: residential demo chargers require host profile UUIDs from auth.users.
-- After creating demo users alex@chargelocal.test and jordan@chargelocal.test, run:
-- SELECT create_charger_listing(...) for each persona per handoff §78.
