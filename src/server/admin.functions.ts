import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fanoutSlotEvent } from "./slots.server";
import { generateScraperKey } from "@/lib/hmac";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const injectTestSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      centre_id: z.string().uuid(),
      category_id: z.string().uuid(),
      slot_date: z.string().min(8),
      slot_time: z.string().nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: ins, error } = await supabaseAdmin
      .from("slot_events")
      .insert({
        centre_id: data.centre_id,
        category_id: data.category_id,
        slot_date: data.slot_date,
        slot_time: data.slot_time || null,
        source: "scraper",
        raw_url: null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const notified = await fanoutSlotEvent(ins.id);
    return { id: ins.id, notified };
  });

export const createScraperKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ name: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const pepper = process.env.SCRAPER_WEBHOOK_PEPPER;
    if (!pepper) throw new Error("SCRAPER_WEBHOOK_PEPPER not configured");
    const { secret, prefix, hash } = generateScraperKey(pepper);
    const { error } = await supabaseAdmin.from("scraper_keys").insert({
      name: data.name, key_prefix: prefix, key_hash: hash, active: true,
    });
    if (error) throw new Error(error.message);
    return { secret };
  });

export const listScraperKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("scraper_keys")
      .select("id,name,key_prefix,active,last_heartbeat_at,last_slot_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { keys: data ?? [] };
  });
