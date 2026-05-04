
ALTER TABLE public.scraper_keys
  ADD COLUMN IF NOT EXISTS key_prefix text;

CREATE UNIQUE INDEX IF NOT EXISTS scraper_keys_key_prefix_uidx
  ON public.scraper_keys(key_prefix) WHERE key_prefix IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS slot_events_dedup_uidx
  ON public.slot_events(centre_id, category_id, slot_date, COALESCE(slot_time, '00:00:00'::time));

CREATE OR REPLACE FUNCTION public.ingest_slot_event(
  _scraper_id uuid,
  _centre_id uuid,
  _category_id uuid,
  _slot_date date,
  _slot_time time,
  _raw_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  UPDATE public.scraper_keys
    SET last_heartbeat_at = now(), last_slot_at = now()
    WHERE id = _scraper_id;

  INSERT INTO public.slot_events (centre_id, category_id, slot_date, slot_time, raw_url, source, scraper_id)
  VALUES (_centre_id, _category_id, _slot_date, _slot_time, _raw_url, 'scraper', _scraper_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_scraper(_scraper_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.scraper_keys SET last_heartbeat_at = now() WHERE id = _scraper_id;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_notification(
  _user_id uuid,
  _slot_event_id uuid,
  _channel notification_channel,
  _status text,
  _error text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.notifications_log (user_id, slot_event_id, channel, status, error)
  VALUES (_user_id, _slot_event_id, _channel, _status, _error)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
