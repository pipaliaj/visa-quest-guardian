
REVOKE EXECUTE ON FUNCTION public.ingest_slot_event(uuid, uuid, uuid, date, time, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.heartbeat_scraper(uuid) FROM PUBLIC, anon, authenticated;
