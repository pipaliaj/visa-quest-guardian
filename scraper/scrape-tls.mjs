#!/usr/bin/env node
/**
 * TLScontact slot scraper -> Lovable webhook bridge.
 *
 * Polls a list of TLScontact appointment URLs, extracts visible slots, and
 * POSTs each one to /api/public/slots with HMAC-SHA256 signing.
 *
 * Run with `--once` for a single sweep (useful for cron / testing).
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const {
  WEBHOOK_URL,
  SCRAPER_KEY,
  POLL_INTERVAL_SEC = '90',
  JITTER_SEC = '30',
  HEARTBEAT_SEC = '300',
  HEADLESS = 'true',
  USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
} = process.env;

if (!WEBHOOK_URL || !SCRAPER_KEY) {
  console.error('Missing WEBHOOK_URL or SCRAPER_KEY in env');
  process.exit(1);
}

const targets = JSON.parse(readFileSync(new URL('./targets.json', import.meta.url), 'utf8'));
const ONCE = process.argv.includes('--once');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => Math.floor(Math.random() * Number(JITTER_SEC) * 1000);

let lastHeartbeat = 0;

async function postSignedJSON(payload) {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', SCRAPER_KEY).update(body).digest('hex');
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-scraper-key': SCRAPER_KEY,
      'x-scraper-signature': signature,
    },
    body,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function maybeHeartbeat() {
  const now = Date.now();
  if (now - lastHeartbeat < Number(HEARTBEAT_SEC) * 1000) return;
  lastHeartbeat = now;
  try {
    const r = await postSignedJSON({ heartbeat: true });
    console.log(`[heartbeat] ${r.status}`);
  } catch (e) {
    console.error('[heartbeat] failed', e.message);
  }
}

/**
 * Extract slots from the current page DOM.
 * TLScontact's markup varies — adjust these selectors as needed.
 * Returns [{ slot_date: 'YYYY-MM-DD', slot_time: 'HH:MM' | null }].
 */
async function extractSlots(page) {
  return await page.evaluate(() => {
    const out = [];

    // Strategy 1: explicit data-date attributes
    document.querySelectorAll('[data-date]').forEach((el) => {
      const date = el.getAttribute('data-date');
      const time = el.getAttribute('data-time') || null;
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.push({ slot_date: date, slot_time: time });
    });

    // Strategy 2: look for visible appointment buttons with text like "14 May 2026 - 10:30"
    const re = /(\d{1,2})[\s\-/](\w{3,9})[\s\-/](\d{4})(?:\D+(\d{1,2}):(\d{2}))?/;
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    document.querySelectorAll('button, a, .appointment-slot, .slot, [class*="slot"]').forEach((el) => {
      const t = (el.textContent || '').trim();
      const m = t.match(re);
      if (!m) return;
      const day = String(m[1]).padStart(2, '0');
      const monKey = m[2].slice(0, 3).toLowerCase();
      const mon = months[monKey];
      if (!mon) return;
      const date = `${m[3]}-${String(mon).padStart(2, '0')}-${day}`;
      const time = m[4] && m[5] ? `${m[4].padStart(2, '0')}:${m[5]}` : null;
      out.push({ slot_date: date, slot_time: time });
    });

    // De-dupe
    const seen = new Set();
    return out.filter((s) => {
      const k = `${s.slot_date}|${s.slot_time || ''}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
}

async function pollTarget(browser, target) {
  const ctx = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try {
    console.log(`[poll] ${target.label}`);
    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45_000 });
    // Many TLS pages need a click into the calendar — extend here per target if needed.
    await page.waitForTimeout(2_000);
    const slots = await extractSlots(page);
    console.log(`[poll] ${target.label}: ${slots.length} slots`);
    for (const s of slots) {
      const r = await postSignedJSON({
        centre_id: target.centre_id,
        category_id: target.category_id,
        slot_date: s.slot_date,
        slot_time: s.slot_time,
        raw_url: target.url,
      });
      console.log(`  -> ${r.status} ${r.body.slice(0, 120)}`);
    }
  } catch (e) {
    console.error(`[poll] ${target.label} failed:`, e.message);
  } finally {
    await ctx.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS !== 'false' });
  console.log(`[start] ${targets.length} targets, every ${POLL_INTERVAL_SEC}s (+jitter ${JITTER_SEC}s)`);

  do {
    await maybeHeartbeat();
    for (const t of targets) {
      await pollTarget(browser, t);
    }
    if (ONCE) break;
    const wait = Number(POLL_INTERVAL_SEC) * 1000 + jitter();
    console.log(`[idle] sleeping ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  } while (true);

  await browser.close();
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});