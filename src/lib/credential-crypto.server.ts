/**
 * AES-256-GCM encryption for vaulted scraper credentials.
 *
 * The encryption key is derived from SCRAPER_WEBHOOK_PEPPER via SHA-256 so we
 * reuse the existing server secret without adding a new env var. Each value
 * gets a fresh random 12-byte IV. Output is stored as three base64 columns
 * (ciphertext, iv, auth tag) so we never need to parse a packed blob.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const pepper = process.env.SCRAPER_WEBHOOK_PEPPER;
  if (!pepper) throw new Error("SCRAPER_WEBHOOK_PEPPER not configured");
  return createHash("sha256").update(pepper).digest();
}

export type EncryptedField = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptField(plaintext: string | null | undefined): EncryptedField | null {
  if (!plaintext) return null;
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptField(field: Partial<EncryptedField> | null | undefined): string | null {
  if (!field || !field.ciphertext || !field.iv || !field.tag) return null;
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(field.iv, "base64"));
  decipher.setAuthTag(Buffer.from(field.tag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(field.ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}