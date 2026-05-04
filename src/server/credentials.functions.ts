import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { encryptField } from "@/lib/credential-crypto.server";

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

const ProviderEnum = z.enum(["tls", "vfs", "bls", "visametric", "other"]);

export const listCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("scraper_credentials")
      .select("id,centre_id,provider,label,active,updated_at,centres(city)")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { credentials: data ?? [] };
  });

export const upsertCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      centre_id: z.string().uuid(),
      provider: ProviderEnum,
      label: z.string().min(1).max(80),
      username: z.string().max(255).optional().nullable(),
      password: z.string().max(255).optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
      active: z.boolean().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const u = encryptField(data.username);
    const p = encryptField(data.password);
    const n = encryptField(data.notes);

    const row = {
      centre_id: data.centre_id,
      provider: data.provider,
      label: data.label,
      active: data.active ?? true,
      username_ciphertext: u?.ciphertext ?? null,
      username_iv: u?.iv ?? null,
      username_tag: u?.tag ?? null,
      password_ciphertext: p?.ciphertext ?? null,
      password_iv: p?.iv ?? null,
      password_tag: p?.tag ?? null,
      notes_ciphertext: n?.ciphertext ?? null,
      notes_iv: n?.iv ?? null,
      notes_tag: n?.tag ?? null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin
        .from("scraper_credentials")
        .update(row)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id, updated: true };
    } else {
      const { data: ins, error } = await supabaseAdmin
        .from("scraper_credentials")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: ins.id, created: true };
    }
  });

export const deleteCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("scraper_credentials")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });