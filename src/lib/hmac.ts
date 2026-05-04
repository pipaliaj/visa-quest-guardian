import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

// Hash a scraper key for at-rest storage. Uses pepper + sha256.
export function hashScraperKey(secret: string, pepper: string): string {
  return createHash("sha256").update(`${pepper}:${secret}`).digest("hex");
}

// Generate a new scraper key: returns { secret, prefix, hash }.
// Secret format: ssk_<prefix>_<random>. Prefix is the first 8 chars of random.
export function generateScraperKey(pepper: string) {
  const random = randomBytes(24).toString("hex"); // 48 chars
  const prefix = random.slice(0, 8);
  const secret = `ssk_${prefix}_${random.slice(8)}`;
  const hash = hashScraperKey(secret, pepper);
  return { secret, prefix, hash };
}

export function extractPrefix(secret: string): string | null {
  const m = secret.match(/^ssk_([a-f0-9]{8})_/);
  return m ? m[1] : null;
}

export function verifyHmacSha256(body: string, signatureHex: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHex || "");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
