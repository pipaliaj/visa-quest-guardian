
DROP POLICY IF EXISTS "Service inserts notifications" ON public.notifications_log;
CREATE POLICY "Service inserts notifications" ON public.notifications_log
  FOR INSERT TO service_role WITH CHECK (true);

REVOKE EXECUTE ON FUNCTION public.match_trackers_for_slot(uuid) FROM PUBLIC, anon, authenticated;
