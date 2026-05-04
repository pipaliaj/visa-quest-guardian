/**
 * Returns decrypted scraper credentials for a given centre + provider.
 *
 * Authenticated with the same scraper key + HMAC signature as /api/public/slots.
 * Returns ONLY the rows for the requested centre/provider — never a global dump.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { hashScraperKey, extractPrefix, verifyHmacSha256 } from "@/lib/hmac";
import { decryptField } from "@/lib/credential-crypto.server";

const QuerySchema = z.object({
  centre_id: z.string().uuid(),
  provider: z.enum(["tls", "vfs", "bls", "visametric", "other"]),
});

export const Route = createFileRoute("/api/public/credentials")({
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
        if (!signature || !verifyHmacSha256(bodyText, signature, apiKey)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let parsed: z.infer<typeof QuerySchema>;
        try { parsed = QuerySchema.parse(JSON.parse(bodyText || "{}")); }
        catch (e: any) { return new Response("Bad payload: " + e.message, { status: 400 }); }

        const { data: rows, error } = await supabaseAdmin
          .from("scraper_credentials")
          .select("id,label,username_ciphertext,username_iv,username_tag,password_ciphertext,password_iv,password_tag,notes_ciphertext,notes_iv,notes_tag")
          .eq("centre_id", parsed.centre_id)
          .eq("provider", parsed.provider)
          .eq("active", true);
        if (error) return new Response(error.message, { status: 500 });

        const credentials = (rows ?? []).map((r) => ({
          id: r.id,
          label: r.label,
          username: decryptField({ ciphertext: r.username_ciphertext!, iv: r.username_iv!, tag: r.username_tag! }),
          password: decryptField({ ciphertext: r.password_ciphertext!, iv: r.password_iv!, tag: r.password_tag! }),
          notes: decryptField({ ciphertext: r.notes_ciphertext!, iv: r.notes_iv!, tag: r.notes_tag! }),
        }));

        return Response.json({ ok: true, credentials });
      },
    },
  },
});