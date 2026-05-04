import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashScraperKey, extractPrefix, verifyHmacSha256 } from "@/lib/hmac";
import { fanoutSlotEvent } from "@/server/slots.server";

const PayloadSchema = z.object({
  centre_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  slot_date: z.string().min(8).optional(),
  slot_time: z.string().nullable().optional(),
  raw_url: z.string().max(2048).nullable().optional(),
  heartbeat: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/slots")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const pepper = process.env.SCRAPER_WEBHOOK_PEPPER;
        if (!pepper) return new Response("Server misconfigured", { status: 500 });

        const apiKey = request.headers.get("x-scraper-key") || "";
        const signature = request.headers.get("x-scraper-signature") || "";
        if (!apiKey) return new Response("Missing x-scraper-key", { status: 401 });

        const prefix = extractPrefix(apiKey);
        if (!prefix) return new Response("Bad key format", { status: 401 });

        const { data: keyRow } = await supabaseAdmin
          .from("scraper_keys")
          .select("id,key_hash,active")
          .eq("key_prefix", prefix)
          .maybeSingle();
        if (!keyRow || !keyRow.active) return new Response("Invalid key", { status: 401 });

        const expectedHash = hashScraperKey(apiKey, pepper);
        if (expectedHash !== keyRow.key_hash) return new Response("Invalid key", { status: 401 });

        const bodyText = await request.text();
        if (signature && !verifyHmacSha256(bodyText, signature, apiKey)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof PayloadSchema>;
        try { parsed = PayloadSchema.parse(JSON.parse(bodyText || "{}")); }
        catch (e: any) { return new Response("Bad payload: " + e.message, { status: 400 }); }

        // Heartbeat-only
        if (parsed.heartbeat || !parsed.centre_id) {
          await supabaseAdmin.from("scraper_keys").update({ last_heartbeat_at: new Date().toISOString() }).eq("id", keyRow.id);
          return Response.json({ ok: true, heartbeat: true });
        }

        if (!parsed.centre_id || !parsed.category_id || !parsed.slot_date) {
          return new Response("centre_id, category_id, slot_date required", { status: 400 });
        }

        const { data: ins, error } = await supabaseAdmin
          .from("slot_events")
          .insert({
            centre_id: parsed.centre_id,
            category_id: parsed.category_id,
            slot_date: parsed.slot_date,
            slot_time: parsed.slot_time || null,
            raw_url: parsed.raw_url ?? null,
            source: "scraper",
            scraper_id: keyRow.id,
          })
          .select("id")
          .maybeSingle();

        await supabaseAdmin.from("scraper_keys")
          .update({ last_heartbeat_at: new Date().toISOString(), last_slot_at: new Date().toISOString() })
          .eq("id", keyRow.id);

        if (error) {
          // unique violation = duplicate, treat as ok
          if ((error as any).code === "23505") return Response.json({ ok: true, duplicate: true });
          return new Response(error.message, { status: 500 });
        }

        let notified = 0;
        if (ins?.id) notified = await fanoutSlotEvent(ins.id);
        return Response.json({ ok: true, slot_event_id: ins?.id, notified });
      },
    },
  },
});
