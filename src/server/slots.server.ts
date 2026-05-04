import * as React from "react";
import { renderAsync } from "@react-email/components";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "Schengen Slot Finder";
const SENDER_DOMAIN = "notify.jaypipalia.com";
const FROM_DOMAIN = "notify.jaypipalia.com";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ensureUnsubscribeToken(email: string): Promise<string | null> {
  const normalized = email.toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .select("token,used_at")
    .eq("email", normalized)
    .maybeSingle();
  if (existing && !(existing as any).used_at) return (existing as any).token;
  if (existing && (existing as any).used_at) return null; // already unsubscribed
  const token = generateToken();
  const { error } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .insert({ email: normalized, token } as any);
  if (error) {
    console.error("[fanout] failed to create unsub token", error);
    return null;
  }
  return token;
}

async function isSuppressed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return !!data;
}

export async function fanoutSlotEvent(slotEventId: string): Promise<number> {
  const { data: matches, error } = await supabaseAdmin.rpc(
    "match_trackers_for_slot" as any,
    { _slot_event_id: slotEventId } as any
  );
  if (error) {
    console.error("[fanout] match error", error);
    return 0;
  }
  const userIds: string[] = ((matches as any[]) ?? []).map((r) => r.user_id);
  if (userIds.length === 0) return 0;

  // Load slot details + centre + category + country
  const { data: evt } = await supabaseAdmin
    .from("slot_events")
    .select("id,slot_date,slot_time,raw_url,centres(city,country_id),visa_categories(name)")
    .eq("id", slotEventId)
    .maybeSingle();
  if (!evt) return 0;
  const centreData = (evt as any).centres;
  const catData = (evt as any).visa_categories;
  const { data: country } = centreData?.country_id
    ? await supabaseAdmin.from("countries").select("name").eq("id", centreData.country_id).maybeSingle()
    : { data: null as any };

  const templateData = {
    centre: centreData?.city ?? "",
    category: catData?.name ?? "",
    country: country?.name ?? "",
    slotDate: (evt as any).slot_date,
    slotTime: (evt as any).slot_time ? String((evt as any).slot_time).slice(0, 5) : null,
    bookingUrl: (evt as any).raw_url ?? undefined,
  };

  const tmpl = TEMPLATES["slot-alert"];
  const element = React.createElement(tmpl.component, templateData);
  const html = await renderAsync(element);
  const text = await renderAsync(element, { plainText: true });
  const subject = typeof tmpl.subject === "function" ? tmpl.subject(templateData) : tmpl.subject;

  // Load profiles + auth emails
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,channel_email,channel_web_push")
    .in("id", userIds);

  const wantsEmail = (profiles ?? []).filter((p: any) => p.channel_email).map((p: any) => p.id);
  let emailsQueued = 0;

  if (wantsEmail.length > 0) {
    // Fetch emails via admin auth API
    for (const uid of wantsEmail) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
      const email = u?.user?.email;
      if (!email) continue;
      if (await isSuppressed(email)) {
        await supabaseAdmin.from("notifications_log").insert({
          user_id: uid, slot_event_id: slotEventId, channel: "email", status: "suppressed",
        } as any);
        continue;
      }
      // Dedup: skip if already notified for same slot+user+channel
      const { data: dup } = await supabaseAdmin
        .from("notifications_log")
        .select("id")
        .eq("user_id", uid).eq("slot_event_id", slotEventId).eq("channel", "email")
        .maybeSingle();
      if (dup) continue;

      const messageId = crypto.randomUUID();
      const unsubToken = await ensureUnsubscribeToken(email);
      const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email" as any, {
        queue_name: "transactional_emails",
        payload: {
          message_id: messageId,
          to: email,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text,
          purpose: "transactional",
          label: "slot-alert",
          idempotency_key: `slot-${slotEventId}-${uid}`,
          unsubscribe_token: unsubToken,
          queued_at: new Date().toISOString(),
        },
      } as any);

      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "slot-alert",
        recipient_email: email,
        status: enqErr ? "failed" : "pending",
        error_message: enqErr ? enqErr.message : null,
      } as any);

      await supabaseAdmin.from("notifications_log").insert({
        user_id: uid,
        slot_event_id: slotEventId,
        channel: "email",
        status: enqErr ? "failed" : "queued",
        error: enqErr?.message ?? null,
      } as any);

      if (!enqErr) emailsQueued++;
    }
  }

  // Log web_push as queued (actual push wired in next phase)
  for (const p of (profiles ?? []) as any[]) {
    if (p.channel_web_push) {
      await supabaseAdmin.from("notifications_log").insert({
        user_id: p.id, slot_event_id: slotEventId, channel: "web_push", status: "queued",
      } as any).then(() => {}, () => {});
    }
  }

  return emailsQueued || userIds.length;
}
