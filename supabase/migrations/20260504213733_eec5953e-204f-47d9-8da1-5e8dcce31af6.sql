
REVOKE ALL ON FUNCTION public.ingest_slot_event(uuid, uuid, uuid, date, time, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.heartbeat_scraper(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_notification(uuid, uuid, notification_channel, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin() TO authenticated;
