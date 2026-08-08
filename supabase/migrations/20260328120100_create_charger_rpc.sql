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
  p_neighborhood TEXT
) RETURNS UUID AS $$
DECLARE
  v_host_id UUID := auth.uid();
  v_id UUID := gen_random_uuid();
  v_public GEOGRAPHY;
BEGIN
  IF v_host_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_public := fuzz_coordinate(p_lng, p_lat, v_id);

  INSERT INTO chargers (
    id, host_id, name, exact_address, location, public_location,
    connector_type, level, max_kw, parking_type, parking_instructions,
    access_instructions_private, approval_mode, pricing_type, price_per_kwh,
    neighborhood, availability_state, status
  ) VALUES (
    v_id, v_host_id, p_name, p_exact_address,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
    v_public,
    p_connector, 'level_2', p_max_kw, p_parking_type, p_parking_instructions,
    p_access_instructions_private, p_approval_mode, p_pricing_type, p_price_per_kwh,
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
