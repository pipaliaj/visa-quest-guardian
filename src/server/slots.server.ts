import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Find matching users via SECURITY DEFINER fn and log notifications.
// Email sending is queued via the project's email infra once configured.
export async function fanoutSlotEvent(slotEventId: string): Promise<number> {
  const { data: matches, error } = await supabaseAdmin.rpc("match_trackers_for_slot", {
    _slot_event_id: slotEventId,
  });
  if (error) {
    console.error("[fanout] match error", error);
    return 0;
  }
  const userIds: string[] = (matches ?? []).map((r: { user_id: string }) => r.user_id);
  if (userIds.length === 0) return 0;

  // Load profiles to know which channels are enabled
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,channel_email,channel_web_push")
    .in("id", userIds);

  const logRows: Array<{ user_id: string; slot_event_id: string; channel: "email" | "web_push"; status: string }> = [];
  for (const p of profiles ?? []) {
    if (p.channel_email) logRows.push({ user_id: p.id, slot_event_id: slotEventId, channel: "email", status: "queued" });
    if (p.channel_web_push) logRows.push({ user_id: p.id, slot_event_id: slotEventId, channel: "web_push", status: "queued" });
  }
  if (logRows.length > 0) {
    const { error: logErr } = await supabaseAdmin.from("notifications_log").insert(logRows);
    if (logErr) console.error("[fanout] log error", logErr);
  }

  // TODO: enqueue real email send once email domain is configured.
  // For now, notifications are logged as 'queued' and a follow-up worker will dispatch.

  return userIds.length;
}
