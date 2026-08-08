-- ChargeLocal initial schema
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enums
CREATE TYPE user_role AS ENUM ('driver', 'host', 'both', 'admin');
CREATE TYPE charger_status AS ENUM ('active', 'paused', 'pending_review');
CREATE TYPE approval_mode AS ENUM ('manual', 'automatic');
CREATE TYPE pricing_type AS ENUM ('free', 'per_kwh', 'per_session', 'per_hour');
CREATE TYPE parking_type AS ENUM ('driveway', 'garage', 'parking_lot', 'street_adjacent', 'other');
CREATE TYPE connector_type AS ENUM ('nacs', 'ccs', 'chademo', 'j1772', 'other');
CREATE TYPE charging_level AS ENUM ('level_1', 'level_2', 'dc_fast');
CREATE TYPE availability_state AS ENUM (
  'available', 'request_required', 'pending_approval', 'reserved',
  'charging', 'temporarily_unavailable', 'offline', 'unknown'
);
CREATE TYPE booking_status AS ENUM (
  'requested', 'approved', 'declined', 'expired', 'cancelled',
  'arriving', 'checked_in', 'charging', 'interrupted', 'completed', 'no_show'
);
CREATE TYPE session_status AS ENUM ('active', 'completed', 'interrupted');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'cancelled', 'failed');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'driver',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  expo_push_token TEXT,
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  blocked_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform settings
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('platform_fee_rate', '0.12'::jsonb),
  ('stripe_test_mode', 'true'::jsonb);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  connector_types connector_type[] NOT NULL DEFAULT '{j1772}',
  battery_capacity_kwh NUMERIC(6,2),
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chargers
CREATE TABLE chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  public_location GEOGRAPHY(POINT, 4326) NOT NULL,
  exact_address TEXT NOT NULL,
  connector_type connector_type NOT NULL DEFAULT 'j1772',
  level charging_level NOT NULL DEFAULT 'level_2',
  max_kw NUMERIC(6,2) NOT NULL DEFAULT 11.5,
  voltage INTEGER,
  amperage INTEGER,
  charger_brand TEXT,
  charger_model TEXT,
  pricing_type pricing_type NOT NULL DEFAULT 'per_kwh',
  price_per_kwh NUMERIC(8,4),
  price_per_session NUMERIC(8,2),
  price_per_hour NUMERIC(8,2),
  approval_mode approval_mode NOT NULL DEFAULT 'manual',
  parking_type parking_type NOT NULL DEFAULT 'driveway',
  parking_instructions TEXT,
  access_instructions_private TEXT,
  arrival_instructions TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status charger_status NOT NULL DEFAULT 'active',
  availability_state availability_state NOT NULL DEFAULT 'request_required',
  rating NUMERIC(3,2),
  completed_sessions INTEGER NOT NULL DEFAULT 0,
  neighborhood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chargers_public_location_idx ON chargers USING GIST (public_location);
CREATE INDEX chargers_host_id_idx ON chargers (host_id);

-- Availability schedule
CREATE TABLE charger_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  requested_start TIMESTAMPTZ NOT NULL,
  requested_end TIMESTAMPTZ NOT NULL,
  approved_start TIMESTAMPTZ,
  approved_end TIMESTAMPTZ,
  status booking_status NOT NULL DEFAULT 'requested',
  requested_kwh NUMERIC(8,2),
  start_soc NUMERIC(5,2),
  target_soc NUMERIC(5,2),
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  driver_message TEXT,
  host_response TEXT,
  suggested_start TIMESTAMPTZ,
  suggested_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bookings_driver_id_idx ON bookings (driver_id);
CREATE INDEX bookings_charger_id_idx ON bookings (charger_id);
CREATE INDEX bookings_status_idx ON bookings (status);

-- Charging sessions
CREATE TABLE charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  start_soc NUMERIC(5,2),
  end_soc NUMERIC(5,2),
  energy_kwh NUMERIC(8,2),
  peak_kw NUMERIC(6,2),
  average_kw NUMERIC(6,2),
  status session_status NOT NULL DEFAULT 'active',
  telemetry_source TEXT NOT NULL DEFAULT 'estimate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  host_id UUID NOT NULL REFERENCES profiles(id),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  host_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, reviewer_id)
);

-- Reports
CREATE TABLE charger_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charger_id UUID REFERENCES chargers(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Public stations cache
CREATE TABLE public_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_station_id TEXT NOT NULL,
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  connector_types connector_type[] NOT NULL DEFAULT '{}',
  max_kw NUMERIC(6,2),
  status availability_state NOT NULL DEFAULT 'unknown',
  availability JSONB,
  pricing_summary JSONB,
  operator TEXT,
  raw_provider_data JSONB,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, provider_station_id)
);

CREATE INDEX public_stations_location_idx ON public_stations USING GIST (location);

-- Activity events
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_events_actor_idx ON activity_events (actor_id, created_at DESC);

-- Booking messages
CREATE TABLE booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved chargers
CREATE TABLE saved_chargers (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charger_id UUID NOT NULL REFERENCES chargers(id) ON DELETE CASCADE,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, charger_id)
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER chargers_updated_at BEFORE UPDATE ON chargers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Coordinate fuzz (deterministic ~150-300m offset)
CREATE OR REPLACE FUNCTION fuzz_coordinate(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_seed UUID
) RETURNS GEOGRAPHY AS $$
DECLARE
  hash_val BIGINT;
  angle DOUBLE PRECISION;
  distance_m DOUBLE PRECISION;
BEGIN
  hash_val := abs(hashtext(p_seed::text));
  angle := (hash_val % 360) * (pi() / 180.0);
  distance_m := 150 + (hash_val % 151);
  RETURN ST_Project(
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    distance_m,
    angle
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Log activity helper
CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_events (actor_id, entity_type, entity_id, event_type, metadata)
  VALUES (p_actor_id, p_entity_type, p_entity_id, p_event_type, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public charger view (no private fields)
CREATE OR REPLACE VIEW public_charger_listings AS
SELECT
  c.id,
  c.host_id,
  c.name,
  c.description,
  ST_Y(c.public_location::geometry) AS public_lat,
  ST_X(c.public_location::geometry) AS public_lng,
  c.connector_type,
  c.level,
  c.max_kw,
  c.pricing_type,
  c.price_per_kwh,
  c.price_per_session,
  c.price_per_hour,
  c.approval_mode,
  c.parking_type,
  c.parking_instructions,
  c.photos,
  c.status,
  c.availability_state,
  c.rating,
  c.completed_sessions,
  c.neighborhood,
  c.charger_brand,
  c.charger_model,
  c.created_at,
  c.updated_at,
  p.display_name AS host_display_name,
  p.avatar_url AS host_avatar_url
FROM chargers c
JOIN profiles p ON p.id = c.host_id
WHERE c.status = 'active';

-- Nearby chargers RPC
CREATE OR REPLACE FUNCTION nearby_chargers(
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_radius_m INTEGER DEFAULT 15000,
  p_residential_only BOOLEAN DEFAULT FALSE,
  p_available_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  host_id UUID,
  name TEXT,
  public_lat DOUBLE PRECISION,
  public_lng DOUBLE PRECISION,
  connector_type connector_type,
  level charging_level,
  max_kw NUMERIC,
  pricing_type pricing_type,
  price_per_kwh NUMERIC,
  price_per_session NUMERIC,
  price_per_hour NUMERIC,
  approval_mode approval_mode,
  parking_type parking_type,
  parking_instructions TEXT,
  photos TEXT[],
  availability_state availability_state,
  rating NUMERIC,
  completed_sessions INTEGER,
  neighborhood TEXT,
  host_display_name TEXT,
  host_avatar_url TEXT,
  distance_m DOUBLE PRECISION,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id, c.host_id, c.name,
    ST_Y(c.public_location::geometry),
    ST_X(c.public_location::geometry),
    c.connector_type, c.level, c.max_kw,
    c.pricing_type, c.price_per_kwh, c.price_per_session, c.price_per_hour,
    c.approval_mode, c.parking_type, c.parking_instructions, c.photos,
    c.availability_state, c.rating, c.completed_sessions, c.neighborhood,
    p.display_name, p.avatar_url,
    ST_Distance(c.public_location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography),
    'residential'::TEXT
  FROM chargers c
  JOIN profiles p ON p.id = c.host_id
  WHERE c.status = 'active'
    AND ST_DWithin(
      c.public_location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    AND (NOT p_available_only OR c.availability_state IN ('available', 'request_required'))
  ORDER BY distance_m;

  IF NOT p_residential_only THEN
    RETURN QUERY
    SELECT
      ps.id, NULL::UUID, ps.name,
      ST_Y(ps.location::geometry),
      ST_X(ps.location::geometry),
      COALESCE(ps.connector_types[1], 'other'::connector_type),
      CASE WHEN ps.max_kw >= 50 THEN 'dc_fast'::charging_level ELSE 'level_2'::charging_level END,
      ps.max_kw,
      'free'::pricing_type, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC,
      'automatic'::approval_mode, 'parking_lot'::parking_type,
      ps.address, ARRAY[]::TEXT[],
      ps.status, NULL::NUMERIC, 0, NULL::TEXT,
      NULL::TEXT, NULL::TEXT,
      ST_Distance(ps.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography),
      'public'::TEXT
    FROM public_stations ps
    WHERE ST_DWithin(
      ps.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    AND (NOT p_available_only OR ps.status = 'available');
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get charger detail with privacy
CREATE OR REPLACE FUNCTION get_charger_detail(p_charger_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_charger chargers%ROWTYPE;
  v_host profiles%ROWTYPE;
  v_booking bookings%ROWTYPE;
  v_can_see_private BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_charger FROM chargers WHERE id = p_charger_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_host FROM profiles WHERE id = v_charger.host_id;

  IF p_user_id IS NOT NULL THEN
    SELECT * INTO v_booking FROM bookings
    WHERE charger_id = p_charger_id
      AND driver_id = p_user_id
      AND status IN ('approved', 'arriving', 'checked_in', 'charging', 'completed')
    ORDER BY created_at DESC LIMIT 1;
    v_can_see_private := FOUND;
  END IF;

  v_result := jsonb_build_object(
    'id', v_charger.id,
    'host_id', v_charger.host_id,
    'name', v_charger.name,
    'description', v_charger.description,
    'public_lat', ST_Y(v_charger.public_location::geometry),
    'public_lng', ST_X(v_charger.public_location::geometry),
    'connector_type', v_charger.connector_type,
    'level', v_charger.level,
    'max_kw', v_charger.max_kw,
    'pricing_type', v_charger.pricing_type,
    'price_per_kwh', v_charger.price_per_kwh,
    'price_per_session', v_charger.price_per_session,
    'price_per_hour', v_charger.price_per_hour,
    'approval_mode', v_charger.approval_mode,
    'parking_type', v_charger.parking_type,
    'parking_instructions', v_charger.parking_instructions,
    'photos', v_charger.photos,
    'availability_state', v_charger.availability_state,
    'rating', v_charger.rating,
    'completed_sessions', v_charger.completed_sessions,
    'neighborhood', v_charger.neighborhood,
    'host', jsonb_build_object(
      'id', v_host.id,
      'display_name', v_host.display_name,
      'avatar_url', v_host.avatar_url
    ),
    'source', 'residential'
  );

  IF v_can_see_private THEN
    v_result := v_result || jsonb_build_object(
      'exact_address', v_charger.exact_address,
      'private_lat', ST_Y(v_charger.location::geometry),
      'private_lng', ST_X(v_charger.location::geometry),
      'arrival_instructions', v_charger.arrival_instructions,
      'access_instructions_private', CASE
        WHEN v_booking.status IN ('arriving', 'checked_in', 'charging') THEN v_charger.access_instructions_private
        ELSE NULL
      END,
      'booking_id', v_booking.id,
      'booking_status', v_booking.status
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Booking state transitions
CREATE OR REPLACE FUNCTION create_booking(
  p_charger_id UUID,
  p_vehicle_id UUID,
  p_requested_start TIMESTAMPTZ,
  p_requested_end TIMESTAMPTZ,
  p_start_soc NUMERIC,
  p_target_soc NUMERIC,
  p_requested_kwh NUMERIC,
  p_estimated_cost NUMERIC,
  p_driver_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_driver_id UUID := auth.uid();
  v_charger chargers%ROWTYPE;
  v_booking_id UUID;
  v_status booking_status := 'requested';
BEGIN
  IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_charger FROM chargers WHERE id = p_charger_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Charger not found'; END IF;

  IF v_charger.approval_mode = 'automatic' THEN
    v_status := 'approved';
  END IF;

  INSERT INTO bookings (
    charger_id, driver_id, vehicle_id, requested_start, requested_end,
    approved_start, approved_end, status, start_soc, target_soc,
    requested_kwh, estimated_cost, driver_message
  ) VALUES (
    p_charger_id, v_driver_id, p_vehicle_id, p_requested_start, p_requested_end,
    CASE WHEN v_status = 'approved' THEN p_requested_start ELSE NULL END,
    CASE WHEN v_status = 'approved' THEN p_requested_end ELSE NULL END,
    v_status, p_start_soc, p_target_soc, p_requested_kwh, p_estimated_cost, p_driver_message
  ) RETURNING id INTO v_booking_id;

  PERFORM log_activity(v_driver_id, 'booking', v_booking_id, 'booking_requested',
    jsonb_build_object('charger_id', p_charger_id));

  IF v_status = 'approved' THEN
    PERFORM log_activity(v_driver_id, 'booking', v_booking_id, 'booking_approved',
      jsonb_build_object('auto', true));
  END IF;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION approve_booking(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  IF v_booking.status != 'requested' THEN RAISE EXCEPTION 'Invalid transition'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM chargers WHERE id = v_booking.charger_id AND host_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE bookings SET
    status = 'approved',
    approved_start = requested_start,
    approved_end = requested_end,
    updated_at = NOW()
  WHERE id = p_booking_id;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id, 'booking_approved', '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decline_booking(
  p_booking_id UUID,
  p_host_response TEXT DEFAULT NULL,
  p_suggested_start TIMESTAMPTZ DEFAULT NULL,
  p_suggested_end TIMESTAMPTZ DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_booking.status != 'requested' THEN RAISE EXCEPTION 'Invalid transition'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM chargers WHERE id = v_booking.charger_id AND host_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  UPDATE bookings SET
    status = 'declined',
    host_response = p_host_response,
    suggested_start = p_suggested_start,
    suggested_end = p_suggested_end,
    updated_at = NOW()
  WHERE id = p_booking_id;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id, 'booking_declined', '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION transition_booking(
  p_booking_id UUID,
  p_new_status booking_status,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_allowed BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  -- Validate transitions
  v_allowed := CASE
    WHEN v_booking.status = 'approved' AND p_new_status IN ('arriving', 'cancelled') THEN TRUE
    WHEN v_booking.status = 'arriving' AND p_new_status IN ('checked_in', 'cancelled', 'no_show') THEN TRUE
    WHEN v_booking.status = 'checked_in' AND p_new_status IN ('charging', 'cancelled') THEN TRUE
    WHEN v_booking.status = 'charging' AND p_new_status IN ('completed', 'interrupted') THEN TRUE
    WHEN v_booking.status = 'requested' AND p_new_status = 'cancelled' AND auth.uid() = v_booking.driver_id THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_allowed THEN RAISE EXCEPTION 'Invalid transition from % to %', v_booking.status, p_new_status; END IF;

  UPDATE bookings SET status = p_new_status, updated_at = NOW() WHERE id = p_booking_id;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id,
    'booking_' || p_new_status::text, jsonb_build_object('reason', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION start_session(p_booking_id UUID, p_start_soc NUMERIC DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_session_id UUID;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF v_booking.status NOT IN ('checked_in', 'approved', 'arriving') THEN
    RAISE EXCEPTION 'Cannot start session';
  END IF;

  UPDATE bookings SET status = 'charging' WHERE id = p_booking_id;

  INSERT INTO charging_sessions (booking_id, started_at, start_soc, status)
  VALUES (p_booking_id, NOW(), COALESCE(p_start_soc, v_booking.start_soc), 'active')
  RETURNING id INTO v_session_id;

  UPDATE chargers SET availability_state = 'charging'
  WHERE id = v_booking.charger_id;

  PERFORM log_activity(auth.uid(), 'session', v_session_id, 'session_started', '{}');
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION end_session(
  p_booking_id UUID,
  p_end_soc NUMERIC,
  p_energy_kwh NUMERIC,
  p_final_cost NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

  UPDATE charging_sessions SET
    ended_at = NOW(),
    end_soc = p_end_soc,
    energy_kwh = p_energy_kwh,
    status = 'completed'
  WHERE booking_id = p_booking_id;

  UPDATE bookings SET status = 'completed', final_cost = p_final_cost WHERE id = p_booking_id;

  UPDATE chargers SET
    availability_state = 'available',
    completed_sessions = completed_sessions + 1
  WHERE id = v_booking.charger_id;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id, 'session_completed',
    jsonb_build_object('energy_kwh', p_energy_kwh, 'final_cost', p_final_cost));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE charger_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE charging_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE charger_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_chargers ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Vehicles
CREATE POLICY vehicles_own ON vehicles FOR ALL USING (auth.uid() = user_id);

-- Chargers: public read via view/RPC; hosts manage own
CREATE POLICY chargers_select_active ON chargers FOR SELECT
  USING (status = 'active' OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));
CREATE POLICY chargers_insert ON chargers FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY chargers_update_own ON chargers FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY chargers_delete_own ON chargers FOR DELETE USING (auth.uid() = host_id);

-- Availability
CREATE POLICY availability_host ON charger_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM chargers c WHERE c.id = charger_id AND c.host_id = auth.uid()));
CREATE POLICY exceptions_host ON availability_exceptions FOR ALL
  USING (EXISTS (SELECT 1 FROM chargers c WHERE c.id = charger_id AND c.host_id = auth.uid()));

-- Bookings
CREATE POLICY bookings_participant ON bookings FOR SELECT USING (
  driver_id = auth.uid() OR EXISTS (
    SELECT 1 FROM chargers c WHERE c.id = charger_id AND c.host_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY bookings_insert ON bookings FOR INSERT WITH CHECK (driver_id = auth.uid());

-- Sessions
CREATE POLICY sessions_participant ON charging_sessions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN chargers c ON c.id = b.charger_id
    WHERE b.id = booking_id AND (b.driver_id = auth.uid() OR c.host_id = auth.uid())
  )
);

-- Reviews
CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Reports
CREATE POLICY reports_insert ON charger_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY reports_admin ON charger_reports FOR SELECT USING (
  reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Public stations read
CREATE POLICY public_stations_read ON public_stations FOR SELECT USING (true);

-- Activity
CREATE POLICY activity_own ON activity_events FOR SELECT USING (
  actor_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Messages
CREATE POLICY messages_participant ON booking_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN chargers c ON c.id = b.charger_id
    WHERE b.id = booking_id AND (b.driver_id = auth.uid() OR c.host_id = auth.uid())
  )
);
CREATE POLICY messages_insert ON booking_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM bookings b
    JOIN chargers c ON c.id = b.charger_id
    WHERE b.id = booking_id AND (b.driver_id = auth.uid() OR c.host_id = auth.uid())
  )
);

-- Saved
CREATE POLICY saved_own ON saved_chargers FOR ALL USING (user_id = auth.uid());

-- Platform settings read
CREATE POLICY platform_settings_read ON platform_settings FOR SELECT USING (true);

-- Storage buckets (run in dashboard or separate migration)
-- avatars: public read, authenticated upload own
-- charger-photos: public read, host upload own
