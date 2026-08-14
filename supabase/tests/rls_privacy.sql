-- Security smoke checks for charger privacy. Run after harden migration:
--   psql "$DATABASE_URL" -f supabase/tests/rls_privacy.sql

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chargers' AND policyname = 'chargers_select_active'
  ) THEN
    RAISE EXCEPTION 'FAIL: leaky chargers_select_active still present';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chargers' AND policyname = 'chargers_select_own'
  ) THEN
    RAISE EXCEPTION 'FAIL: chargers_select_own missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'payments_select_own'
  ) THEN
    RAISE EXCEPTION 'FAIL: payments_select_own missing';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'payments' AND cmd = 'INSERT'
  ) THEN
    RAISE EXCEPTION 'FAIL: clients should not insert payments';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_booking_detail'
  ) THEN
    RAISE EXCEPTION 'FAIL: get_booking_detail missing';
  END IF;

  RAISE NOTICE 'ok: charger privacy policies present';
END $$;
