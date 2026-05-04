/**
 * Scraper watchdog — runs every 5 minutes via pg_cron.
 *
 * For every active scraper key:
 *   - if last_heartbeat_at is older than SILENT_THRESHOLD_MIN minutes,
 *     send an email to all admins (deduped: at most one alert per silent run).
 *
 * Idempotency: we record the alert in `email_send_log` with idempotency_key
 * `scraper-down-<scraperId>-<silentBucket>` where silentBucket is the
 * heartbeat timestamp rounded to the hour. Re-alerts only happen if the
 * scraper is still silent in the next bucket.
 */
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { render as renderAsync } from "@react-email/render";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SILENT_THRESHOLD_MIN = 30;
const SITE_NAME = "Schengen Slot Finder";
const FROM_DOMAIN = "notify.jaypipalia.com";
const SENDER_DOMAIN = "notify.jaypipalia.com";

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
  if (existing && (existing as any).used_at) return null;
  const token = generateToken();
  const { error } = await supabaseAdmin
    .from("email_unsubscribe_tokens")
    .insert({ email: normalized, token } as any);
  if (error) return null;
  return token;
}

export const Route = createFileRoute("/api/public/hooks/scraper-watchdog")({
  server: {
    handlers: {
      POST: async () => {
        const cutoff = new Date(Date.now() - SILENT_THRESHOLD_MIN * 60_000).toISOString();

        const { data: silent, error } = await supabaseAdmin
          .from("scraper_keys")
          .select("id,name,last_heartbeat_at,last_slot_at")
          .eq("active", true)
          .or(`last_heartbeat_at.is.null,last_heartbeat_at.lt.${cutoff}`);
        if (error) return new Response(error.message, { status: 500 });

        if (!silent || silent.length === 0) {
          return Response.json({ ok: true, silent: 0, alerted: 0 });
        }

        // Get all admin user_ids -> emails
        const { data: adminRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        const adminEmails: string[] = [];
        for (const r of (adminRoles ?? []) as any[]) {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          if (u?.user?.email) adminEmails.push(u.user.email);
        }
        if (adminEmails.length === 0) {
          return Response.json({ ok: true, silent: silent.length, alerted: 0, reason: "no admins" });
        }

        const tmpl = TEMPLATES["scraper-down"];
        let alerted = 0;

        for (const s of silent as any[]) {
          const lastHb = s.last_heartbeat_at ? new Date(s.last_heartbeat_at) : null;
          const minutesSilent = lastHb
            ? Math.round((Date.now() - lastHb.getTime()) / 60_000)
            : 9999;

          // Bucket by hour of last heartbeat (or current hour if never)
          const bucket = lastHb
            ? new Date(Math.floor(lastHb.getTime() / 3_600_000) * 3_600_000).toISOString()
            : new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();

          const data = {
            scraperName: s.name,
            minutesSilent,
            lastHeartbeatAt: s.last_heartbeat_at,
            lastSlotAt: s.last_slot_at,
          };
          const element = React.createElement(tmpl.component, data);
          const html = await renderAsync(element);
          const text = await renderAsync(element, { plainText: true });
          const subject = typeof tmpl.subject === "function" ? tmpl.subject(data) : tmpl.subject;

          for (const email of adminEmails) {
            const idempotencyKey = `scraper-down-${s.id}-${bucket}-${email}`;

            // Skip if already enqueued for this bucket
            const { data: existing } = await supabaseAdmin
              .from("email_send_log")
              .select("id")
              .eq("template_name", "scraper-down")
              .eq("recipient_email", email)
              .like("metadata->>idempotency_key", idempotencyKey)
              .maybeSingle();
            if (existing) continue;

            const unsubscribeToken = await ensureUnsubscribeToken(email);
            if (!unsubscribeToken) continue; // already unsubscribed

            const messageId = crypto.randomUUID();
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
                label: "scraper-down",
                unsubscribe_token: unsubscribeToken,
                idempotency_key: idempotencyKey,
                queued_at: new Date().toISOString(),
              },
            } as any);

            await supabaseAdmin.from("email_send_log").insert({
              message_id: messageId,
              template_name: "scraper-down",
              recipient_email: email,
              status: enqErr ? "failed" : "pending",
              error_message: enqErr ? enqErr.message : null,
              metadata: { idempotency_key: idempotencyKey, scraper_id: s.id, minutes_silent: minutesSilent },
            } as any);

            if (!enqErr) alerted++;
          }
        }

        return Response.json({ ok: true, silent: silent.length, alerted });
      },
    },
  },
});