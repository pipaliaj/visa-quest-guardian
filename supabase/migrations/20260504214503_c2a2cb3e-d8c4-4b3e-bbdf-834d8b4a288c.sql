
-- Dedup index for slot events
CREATE UNIQUE INDEX IF NOT EXISTS slot_events_dedup_idx
  ON public.slot_events (centre_id, category_id, slot_date, COALESCE(slot_time, '00:00:00'::time));

-- key_prefix already exists per schema, ensure index for fast lookup
CREATE INDEX IF NOT EXISTS scraper_keys_key_prefix_idx ON public.scraper_keys(key_prefix);

-- Seed visa categories
INSERT INTO public.visa_categories (code, name, description) VALUES
  ('short_stay', 'Short Stay', 'Schengen / short-stay visa (up to 90 days)'),
  ('long_stay', 'Long Stay', 'National long-stay visa (over 90 days)'),
  ('work', 'Work', 'Work / employment visa'),
  ('study', 'Study', 'Student visa')
ON CONFLICT (code) DO NOTHING;

-- Tracker matching function: returns user_ids whose trackers + window + subscription match
CREATE OR REPLACE FUNCTION public.match_trackers_for_slot(_slot_event_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _evt slot_events%ROWTYPE;
  _local_dow int;
  _local_hour int;
BEGIN
  SELECT * INTO _evt FROM slot_events WHERE id = _slot_event_id;
  IF NOT FOUND THEN RETURN; END IF;

  _local_dow := EXTRACT(DOW FROM (now() AT TIME ZONE 'Europe/Dublin'))::int;
  _local_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Europe/Dublin'))::int;

  RETURN QUERY
  SELECT DISTINCT t.user_id
  FROM trackers t
  LEFT JOIN subscriptions s
    ON s.user_id = t.user_id
   AND s.country_id = (SELECT country_id FROM centres WHERE id = _evt.centre_id)
  WHERE t.active = true
    AND t.centre_id = _evt.centre_id
    AND t.category_id = _evt.category_id
    AND (t.alert_window->'days') @> to_jsonb(_local_dow)
    AND (t.alert_window->>'start_hour')::int <= _local_hour
    AND (t.alert_window->>'end_hour')::int > _local_hour
    AND (s.status IS NULL OR s.status IN ('trialing','active'));
END;
$$;

-- Allow service role to insert notification logs (RLS is bypassed by service role anyway, but explicit for clarity)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications_log' AND policyname = 'Service inserts notifications'
  ) THEN
    CREATE POLICY "Service inserts notifications" ON public.notifications_log
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
