-- Harden MVP: storage, privacy RLS, booking RPCs, availability, payments, reviews

-- ── Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('charger-photos', 'charger-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS avatars_own_write ON storage.objects;
DROP POLICY IF EXISTS avatars_own_update ON storage.objects;
DROP POLICY IF EXISTS charger_photos_public_read ON storage.objects;
DROP POLICY IF EXISTS charger_photos_own_write ON storage.objects;
DROP POLICY IF EXISTS charger_photos_own_update ON storage.objects;

CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY avatars_own_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY avatars_own_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY charger_photos_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'charger-photos');
CREATE POLICY charger_photos_own_write ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'charger-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY charger_photos_own_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'charger-photos' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Privacy: chargers are not publicly selectable ────────────────────────────
DROP POLICY IF EXISTS chargers_select_active ON chargers;

CREATE POLICY chargers_select_own ON chargers FOR SELECT
  USING (
    host_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Payments: participants read; writes via service role only ────────────────
DROP POLICY IF EXISTS payments_select_own ON payments;
CREATE POLICY payments_select_own ON payments FOR SELECT USING (
  driver_id = auth.uid() OR host_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Availability helper ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION charger_window_is_open(
  p_charger_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_hours BOOLEAN;
  v_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM charger_availability WHERE charger_id = p_charger_id AND enabled
  ) INTO v_has_hours;

  IF NOT v_has_hours THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM charger_availability a
    WHERE a.charger_id = p_charger_id
      AND a.enabled
      AND a.day_of_week = EXTRACT(DOW FROM p_start AT TIME ZONE 'America/New_York')::int
      AND (p_start AT TIME ZONE 'America/New_York')::time >= a.start_time
      AND (p_end AT TIME ZONE 'America/New_York')::time <= a.end_time
  ) INTO v_ok;

  RETURN COALESCE(v_ok, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION charger_has_overlap(
  p_charger_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ,
  p_exclude_booking UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.charger_id = p_charger_id
      AND b.status IN ('requested', 'approved', 'arriving', 'checked_in', 'charging')
      AND (p_exclude_booking IS NULL OR b.id <> p_exclude_booking)
      AND tstzrange(b.requested_start, b.requested_end, '[)') && tstzrange(p_start, p_end, '[)')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ── create_booking: rate limit + hours + overlap ─────────────────────────────
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
  v_recent INT;
BEGIN
  IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COUNT(*) INTO v_recent FROM bookings
  WHERE driver_id = v_driver_id AND created_at > NOW() - INTERVAL '24 hours';
  IF v_recent >= 10 THEN
    RAISE EXCEPTION 'Too many requests today. Try again tomorrow.';
  END IF;

  SELECT * INTO v_charger FROM chargers WHERE id = p_charger_id AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Charger not found'; END IF;

  IF p_requested_end <= p_requested_start THEN
    RAISE EXCEPTION 'End time must be after start time';
  END IF;

  IF NOT charger_window_is_open(p_charger_id, p_requested_start, p_requested_end) THEN
    RAISE EXCEPTION 'Nothing is open at that time.';
  END IF;

  IF charger_has_overlap(p_charger_id, p_requested_start, p_requested_end) THEN
    RAISE EXCEPTION 'That window is already reserved. Try another time.';
  END IF;

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
    UPDATE chargers SET availability_state = 'reserved' WHERE id = p_charger_id;
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

  IF charger_has_overlap(v_booking.charger_id, v_booking.requested_start, v_booking.requested_end, p_booking_id) THEN
    RAISE EXCEPTION 'That window is already reserved. Try another time.';
  END IF;

  UPDATE bookings SET
    status = 'approved',
    approved_start = requested_start,
    approved_end = requested_end,
    updated_at = NOW()
  WHERE id = p_booking_id;

  UPDATE chargers SET availability_state = 'reserved' WHERE id = v_booking.charger_id;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id, 'booking_approved', '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION transition_booking(
  p_booking_id UUID,
  p_new_status booking_status,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_is_host BOOLEAN;
  v_is_driver BOOLEAN;
  v_allowed BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  v_is_driver := auth.uid() = v_booking.driver_id;
  SELECT EXISTS (
    SELECT 1 FROM chargers WHERE id = v_booking.charger_id AND host_id = auth.uid()
  ) INTO v_is_host;

  IF NOT v_is_driver AND NOT v_is_host THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_allowed := CASE
    WHEN v_booking.status = 'requested' AND p_new_status = 'cancelled' THEN TRUE
    WHEN v_booking.status = 'requested' AND p_new_status = 'expired' THEN TRUE
    WHEN v_booking.status = 'approved' AND p_new_status IN ('arriving', 'cancelled') THEN TRUE
    WHEN v_booking.status = 'approved' AND p_new_status = 'no_show' AND v_is_host THEN TRUE
    WHEN v_booking.status = 'arriving' AND p_new_status IN ('checked_in', 'cancelled') THEN TRUE
    WHEN v_booking.status = 'arriving' AND p_new_status = 'no_show' AND v_is_host THEN TRUE
    WHEN v_booking.status = 'checked_in' AND p_new_status IN ('charging', 'cancelled') THEN TRUE
    WHEN v_booking.status = 'charging' AND p_new_status IN ('completed', 'interrupted') THEN TRUE
    ELSE FALSE
  END;

  IF NOT v_allowed THEN RAISE EXCEPTION 'Invalid transition from % to %', v_booking.status, p_new_status; END IF;

  UPDATE bookings SET status = p_new_status, updated_at = NOW() WHERE id = p_booking_id;

  IF p_new_status IN ('cancelled', 'expired', 'no_show', 'interrupted', 'completed') THEN
    UPDATE chargers SET availability_state = CASE
      WHEN approval_mode = 'automatic' THEN 'available'::availability_state
      ELSE 'request_required'::availability_state
    END
    WHERE id = v_booking.charger_id AND availability_state IN ('reserved', 'charging');
  END IF;

  PERFORM log_activity(auth.uid(), 'booking', p_booking_id,
    'booking_' || p_new_status::text, jsonb_build_object('reason', p_reason));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION expire_stale_bookings()
RETURNS INTEGER AS $$
DECLARE
  n INTEGER;
BEGIN
  WITH expired AS (
    UPDATE bookings SET status = 'expired', updated_at = NOW()
    WHERE status = 'requested'
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING id, charger_id
  )
  SELECT COUNT(*) INTO n FROM expired;
  RETURN COALESCE(n, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Booking detail (privacy-safe join) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION get_booking_detail(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_charger chargers%ROWTYPE;
  v_host profiles%ROWTYPE;
  v_uid UUID := auth.uid();
  v_is_host BOOLEAN;
  v_can_private BOOLEAN;
  v_result JSONB;
BEGIN
  PERFORM expire_stale_bookings();

  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT * INTO v_charger FROM chargers WHERE id = v_booking.charger_id;
  SELECT * INTO v_host FROM profiles WHERE id = v_charger.host_id;

  v_is_host := v_charger.host_id = v_uid;
  IF v_booking.driver_id <> v_uid AND NOT v_is_host AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_uid AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_can_private := v_is_host OR v_booking.status IN (
    'approved', 'arriving', 'checked_in', 'charging', 'completed'
  );

  v_result := jsonb_build_object(
    'id', v_booking.id,
    'charger_id', v_booking.charger_id,
    'driver_id', v_booking.driver_id,
    'host_id', v_charger.host_id,
    'vehicle_id', v_booking.vehicle_id,
    'requested_start', v_booking.requested_start,
    'requested_end', v_booking.requested_end,
    'approved_start', v_booking.approved_start,
    'approved_end', v_booking.approved_end,
    'status', v_booking.status,
    'requested_kwh', v_booking.requested_kwh,
    'start_soc', v_booking.start_soc,
    'target_soc', v_booking.target_soc,
    'estimated_cost', v_booking.estimated_cost,
    'final_cost', v_booking.final_cost,
    'driver_message', v_booking.driver_message,
    'host_response', v_booking.host_response,
    'suggested_start', v_booking.suggested_start,
    'suggested_end', v_booking.suggested_end,
    'created_at', v_booking.created_at,
    'charger', jsonb_build_object(
      'id', v_charger.id,
      'host_id', v_charger.host_id,
      'name', v_charger.name,
      'neighborhood', v_charger.neighborhood,
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
      'public_lat', ST_Y(v_charger.public_location::geometry),
      'public_lng', ST_X(v_charger.public_location::geometry),
      'exact_address', CASE WHEN v_can_private THEN v_charger.exact_address ELSE NULL END,
      'private_lat', CASE WHEN v_can_private THEN ST_Y(v_charger.location::geometry) ELSE NULL END,
      'private_lng', CASE WHEN v_can_private THEN ST_X(v_charger.location::geometry) ELSE NULL END,
      'arrival_instructions', CASE WHEN v_can_private THEN v_charger.arrival_instructions ELSE NULL END,
      'access_instructions_private', CASE
        WHEN v_can_private AND v_booking.status IN ('arriving', 'checked_in', 'charging')
        THEN v_charger.access_instructions_private
        ELSE NULL
      END
    )
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ── Listing create / update ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS create_charger_listing(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, connector_type, NUMERIC, parking_type, TEXT, TEXT, approval_mode, pricing_type, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION create_charger_listing(
  p_name TEXT,
  p_exact_address TEXT,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_connector connector_type,
  p_max_kw NUMERIC,
  p_parking_type parking_type,
  p_parking_instructions TEXT,
  p_access_instructions_private TEXT,
  p_approval_mode approval_mode,
  p_pricing_type pricing_type,
  p_price_per_kwh NUMERIC,
  p_neighborhood TEXT,
  p_price_per_session NUMERIC DEFAULT NULL,
  p_price_per_hour NUMERIC DEFAULT NULL,
  p_photos TEXT[] DEFAULT '{}',
  p_arrival_instructions TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_id UUID := gen_random_uuid();
  v_public GEOGRAPHY;
  v_level charging_level;
BEGIN
  IF v_host_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_lat IS NULL OR p_lng IS NULL THEN RAISE EXCEPTION 'Location required'; END IF;

  v_public := fuzz_coordinate(p_lng, p_lat, v_id);
  v_level := CASE WHEN p_max_kw >= 50 THEN 'dc_fast'::charging_level ELSE 'level_2'::charging_level END;

  INSERT INTO chargers (
    id, host_id, name, exact_address, location, public_location,
    connector_type, level, max_kw, parking_type, parking_instructions,
    access_instructions_private, arrival_instructions, approval_mode, pricing_type,
    price_per_kwh, price_per_session, price_per_hour, photos,
    neighborhood, availability_state, status
  ) VALUES (
    v_id, v_host_id, p_name, p_exact_address,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    v_public,
    p_connector, v_level, p_max_kw, p_parking_type, p_parking_instructions,
    p_access_instructions_private, p_arrival_instructions, p_approval_mode, p_pricing_type,
    p_price_per_kwh, p_price_per_session, p_price_per_hour, COALESCE(p_photos, '{}'),
    p_neighborhood,
    CASE WHEN p_approval_mode = 'automatic' THEN 'available'::availability_state ELSE 'request_required'::availability_state END,
    'active'
  );

  UPDATE profiles SET role = CASE WHEN role = 'driver' THEN 'both'::user_role ELSE role END
  WHERE id = v_host_id;

  PERFORM log_activity(v_host_id, 'charger', v_id, 'charger_created', '{}');
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_charger_listing(
  p_charger_id UUID,
  p_name TEXT,
  p_exact_address TEXT,
  p_lng DOUBLE PRECISION,
  p_lat DOUBLE PRECISION,
  p_connector connector_type,
  p_max_kw NUMERIC,
  p_parking_type parking_type,
  p_parking_instructions TEXT,
  p_access_instructions_private TEXT,
  p_approval_mode approval_mode,
  p_pricing_type pricing_type,
  p_price_per_kwh NUMERIC,
  p_neighborhood TEXT,
  p_price_per_session NUMERIC DEFAULT NULL,
  p_price_per_hour NUMERIC DEFAULT NULL,
  p_photos TEXT[] DEFAULT NULL,
  p_arrival_instructions TEXT DEFAULT NULL,
  p_status charger_status DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_existing chargers%ROWTYPE;
  v_public GEOGRAPHY;
BEGIN
  IF v_host_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_existing FROM chargers WHERE id = p_charger_id AND host_id = v_host_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;

  v_public := fuzz_coordinate(p_lng, p_lat, p_charger_id);

  UPDATE chargers SET
    name = p_name,
    exact_address = p_exact_address,
    location = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    public_location = v_public,
    connector_type = p_connector,
    level = CASE WHEN p_max_kw >= 50 THEN 'dc_fast'::charging_level ELSE 'level_2'::charging_level END,
    max_kw = p_max_kw,
    parking_type = p_parking_type,
    parking_instructions = p_parking_instructions,
    access_instructions_private = p_access_instructions_private,
    arrival_instructions = p_arrival_instructions,
    approval_mode = p_approval_mode,
    pricing_type = p_pricing_type,
    price_per_kwh = p_price_per_kwh,
    price_per_session = p_price_per_session,
    price_per_hour = p_price_per_hour,
    photos = COALESCE(p_photos, photos),
    neighborhood = p_neighborhood,
    status = COALESCE(p_status, status),
    availability_state = CASE
      WHEN COALESCE(p_status, status) = 'paused' THEN 'temporarily_unavailable'::availability_state
      WHEN p_approval_mode = 'automatic' THEN 'available'::availability_state
      ELSE 'request_required'::availability_state
    END,
    updated_at = NOW()
  WHERE id = p_charger_id;

  PERFORM log_activity(v_host_id, 'charger', p_charger_id, 'charger_updated', '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_charger_paused(p_charger_id UUID, p_paused BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM chargers WHERE id = p_charger_id AND host_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE chargers SET
    status = CASE WHEN p_paused THEN 'paused'::charger_status ELSE 'active'::charger_status END,
    availability_state = CASE
      WHEN p_paused THEN 'temporarily_unavailable'::availability_state
      WHEN approval_mode = 'automatic' THEN 'available'::availability_state
      ELSE 'request_required'::availability_state
    END
  WHERE id = p_charger_id;
  PERFORM log_activity(auth.uid(), 'charger', p_charger_id,
    CASE WHEN p_paused THEN 'charger_paused' ELSE 'charger_resumed' END, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Reviews roll up charger rating ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_charger_rating(p_charger_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chargers c SET rating = sub.avg_rating
  FROM (
    SELECT ROUND(AVG(r.rating)::numeric, 2) AS avg_rating
    FROM reviews r
    JOIN bookings b ON b.id = r.booking_id
    WHERE b.charger_id = p_charger_id AND r.reviewee_id = (
      SELECT host_id FROM chargers WHERE id = p_charger_id
    )
  ) sub
  WHERE c.id = p_charger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_review(
  p_booking_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_charger chargers%ROWTYPE;
  v_reviewee UUID;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_booking.status <> 'completed' THEN RAISE EXCEPTION 'Review after completed session only'; END IF;
  IF auth.uid() <> v_booking.driver_id AND NOT EXISTS (
    SELECT 1 FROM chargers WHERE id = v_booking.charger_id AND host_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  SELECT * INTO v_charger FROM chargers WHERE id = v_booking.charger_id;
  v_reviewee := CASE
    WHEN auth.uid() = v_booking.driver_id THEN v_charger.host_id
    ELSE v_booking.driver_id
  END;

  INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
  VALUES (p_booking_id, auth.uid(), v_reviewee, p_rating, p_comment)
  RETURNING id INTO v_id;

  PERFORM refresh_charger_rating(v_charger.id);
  PERFORM log_activity(auth.uid(), 'review', v_id, 'review_submitted', jsonb_build_object('rating', p_rating));
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION nearby_chargers(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER, BOOLEAN, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_charger_detail(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_booking_detail(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_booking(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION transition_booking(UUID, booking_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION expire_stale_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION create_charger_listing(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, connector_type, NUMERIC, parking_type, TEXT, TEXT, approval_mode, pricing_type, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_charger_listing(UUID, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, connector_type, NUMERIC, parking_type, TEXT, TEXT, approval_mode, pricing_type, NUMERIC, TEXT, NUMERIC, NUMERIC, TEXT[], TEXT, charger_status) TO authenticated;
GRANT EXECUTE ON FUNCTION set_charger_paused(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_review(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION start_session(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION end_session(UUID, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
