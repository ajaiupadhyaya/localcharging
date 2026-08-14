-- Demo auth users + residential listings. Idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public_stations (provider, provider_station_id, name, location, address, connector_types, max_kw, status, operator)
VALUES
  ('demo', 'dc-fast-1', 'Demo DC Fast · 250 kW', ST_SetSRID(ST_MakePoint(-77.0369, 38.9072), 4326)::geography, 'Washington, DC', ARRAY['ccs']::connector_type[], 250, 'available', 'Demo Network'),
  ('demo', 'dc-fast-2', 'Demo DC Fast · 150 kW', ST_SetSRID(ST_MakePoint(-77.4340, 37.5407), 4326)::geography, 'Richmond, VA', ARRAY['ccs']::connector_type[], 150, 'unknown', 'Demo Network'),
  ('demo', 'cville-l2', 'Demo Level 2 · Downtown', ST_SetSRID(ST_MakePoint(-78.4767, 38.0293), 4326)::geography, 'Charlottesville, VA', ARRAY['j1772']::connector_type[], 11, 'available', 'Demo Network')
ON CONFLICT (provider, provider_station_id) DO NOTHING;

WITH new_users (email, display_name) AS (
  VALUES
    ('driver@chargelocal.test', 'Demo Driver'),
    ('host@chargelocal.test', 'Alex'),
    ('maya@chargelocal.test', 'Maya'),
    ('jordan@chargelocal.test', 'Jordan'),
    ('chris@chargelocal.test', 'Chris')
)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  n.email,
  crypt('ChargeLocalDemo1!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', n.display_name),
  NOW(),
  NOW(),
  NULL,
  NULL,
  NULL,
  NULL
FROM new_users n
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.email = n.email);

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.email IN (
  'driver@chargelocal.test', 'host@chargelocal.test', 'maya@chargelocal.test',
  'jordan@chargelocal.test', 'chris@chargelocal.test'
)
AND NOT EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email');

UPDATE profiles SET email_verified = TRUE, role = CASE
  WHEN id = (SELECT id FROM auth.users WHERE email = 'driver@chargelocal.test') THEN 'driver'::user_role
  ELSE 'both'::user_role
END
WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@chargelocal.test');

INSERT INTO vehicles (user_id, make, model, year, connector_types, battery_capacity_kwh, nickname)
SELECT u.id, 'Tesla', 'Model 3', 2022, ARRAY['nacs','j1772']::connector_type[], 75, 'Daily'
FROM auth.users u
WHERE u.email = 'driver@chargelocal.test'
AND NOT EXISTS (SELECT 1 FROM vehicles v WHERE v.user_id = u.id);

-- Listings
INSERT INTO chargers (
  host_id, name, exact_address, location, public_location, connector_type, level, max_kw,
  parking_type, parking_instructions, access_instructions_private, arrival_instructions,
  approval_mode, pricing_type, price_per_kwh, price_per_session, neighborhood,
  availability_state, status
)
SELECT
  u.id,
  l.name,
  l.address,
  ST_SetSRID(ST_MakePoint(l.lng, l.lat), 4326)::geography,
  fuzz_coordinate(l.lng, l.lat, gen_random_uuid()),
  l.connector::connector_type,
  'level_2',
  l.max_kw,
  l.parking::parking_type,
  l.parking_instructions,
  l.access_instructions,
  l.parking_instructions,
  l.approval::approval_mode,
  l.pricing::pricing_type,
  l.price_kwh,
  l.price_session,
  l.neighborhood,
  CASE WHEN l.approval = 'automatic' THEN 'available'::availability_state ELSE 'request_required'::availability_state END,
  'active'
FROM auth.users u
JOIN (VALUES
  ('host@chargelocal.test', 'Alex''s Home Charger', '812 Levy Ave, Charlottesville, VA', -78.4774, 38.0251, 'j1772', 11.5, 'driveway',
   'Pull into the right side of the driveway. Outdoor charger on the wall.', 'Side gate latch — lift and push.', 'manual', 'per_kwh', 0.18, NULL::numeric, 'Belmont'),
  ('maya@chargelocal.test', 'Maya''s NACS', '209 Shamrock Rd, Charlottesville, VA', -78.4948, 38.0264, 'nacs', 11.5, 'driveway',
   'Park beside the gray Civic. Charger on the left post.', NULL, 'automatic', 'free', NULL::numeric, NULL::numeric, 'Fry''s Spring'),
  ('jordan@chargelocal.test', 'Jordan''s Fan District', '1814 Hanover Ave, Richmond, VA', -77.4602, 37.5531, 'j1772', 7.2, 'street_adjacent',
   'Street spot in front of the brick row house. Cone marks the stall.', NULL, 'manual', 'per_session', NULL::numeric, 5::numeric, 'The Fan'),
  ('chris@chargelocal.test', 'Chris · Navy Yard', '1201 4th St SE, Washington, DC', -77.0018, 38.8762, 'j1772', 11.5, 'garage',
   'Assigned outdoor stall B3. Do not enter the building.', 'Call box: 14# then wait for the click.', 'manual', 'per_kwh', 0.22, NULL::numeric, 'Navy Yard')
) AS l(email, name, address, lng, lat, connector, max_kw, parking, parking_instructions, access_instructions, approval, pricing, price_kwh, price_session, neighborhood)
  ON u.email = l.email
WHERE NOT EXISTS (
  SELECT 1 FROM chargers c WHERE c.host_id = u.id AND c.name = l.name
);

INSERT INTO charger_availability (charger_id, day_of_week, start_time, end_time, enabled)
SELECT c.id, d.day, '17:00'::time, '21:00'::time, TRUE
FROM chargers c
JOIN profiles p ON p.id = c.host_id
JOIN auth.users u ON u.id = p.id
CROSS JOIN (VALUES (1),(2),(3),(4),(5)) AS d(day)
WHERE u.email IN ('host@chargelocal.test', 'chris@chargelocal.test')
AND NOT EXISTS (SELECT 1 FROM charger_availability a WHERE a.charger_id = c.id);

INSERT INTO charger_availability (charger_id, day_of_week, start_time, end_time, enabled)
SELECT c.id, d.day, '08:00'::time, '22:00'::time, TRUE
FROM chargers c
JOIN auth.users u ON u.id = c.host_id
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(day)
WHERE u.email = 'maya@chargelocal.test'
AND NOT EXISTS (SELECT 1 FROM charger_availability a WHERE a.charger_id = c.id);

INSERT INTO charger_availability (charger_id, day_of_week, start_time, end_time, enabled)
SELECT c.id, d.day, '18:00'::time, '22:00'::time, TRUE
FROM chargers c
JOIN auth.users u ON u.id = c.host_id
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(day)
WHERE u.email = 'jordan@chargelocal.test'
AND NOT EXISTS (SELECT 1 FROM charger_availability a WHERE a.charger_id = c.id);

SELECT email FROM auth.users WHERE email LIKE '%@chargelocal.test' ORDER BY email;
