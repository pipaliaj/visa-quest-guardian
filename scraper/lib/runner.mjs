/**
 * Shared scraper runtime. Each provider script imports `runScraper(extractSlots)`
 * and supplies its own DOM extraction logic. Everything else (HMAC signing,
 * webhook posting, jittered polling, heartbeats, systemd-friendly logging) is
 * identical across providers.
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = () => Math.floor(Math.random() * Number(JITTER_SEC) * 1000);

export function loadTargets(filename) {
  return JSON.parse(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'));
}

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
  return { status: res.status, body: await res.text() };
}

/**
 * @param {object} opts
 * @param {string} opts.provider     - 'tls' | 'vfs' | 'bls'
 * @param {string} opts.targetsFile  - e.g. 'targets-tls.json'
 * @param {(page: import('playwright').Page, target: object) => Promise<Array<{slot_date: string, slot_time: string|null}>>} opts.extractSlots
 */
export async function runScraper({ provider, targetsFile, extractSlots }) {
  if (!WEBHOOK_URL || !SCRAPER_KEY) {
    console.error('Missing WEBHOOK_URL or SCRAPER_KEY in env');
    process.exit(1);
  }

  const targets = loadTargets(targetsFile);
  const ONCE = process.argv.includes('--once');
  let lastHeartbeat = 0;

  async function maybeHeartbeat() {
    const now = Date.now();
    if (now - lastHeartbeat < Number(HEARTBEAT_SEC) * 1000) return;
    lastHeartbeat = now;
    try {
      const r = await postSignedJSON({ heartbeat: true, provider });
      console.log(`[${provider}][heartbeat] ${r.status}`);
    } catch (e) {
      console.error(`[${provider}][heartbeat] failed`, e.message);
    }
  }

  async function pollTarget(browser, target) {
    const ctx = await browser.newContext({ userAgent: USER_AGENT, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    try {
      console.log(`[${provider}][poll] ${target.label}`);
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45_000 });
      await page.waitForTimeout(2_000);
      const slots = await extractSlots(page, target);
      console.log(`[${provider}][poll] ${target.label}: ${slots.length} slots`);
      for (const s of slots) {
        const r = await postSignedJSON({
          centre_id: target.centre_id,
          category_id: target.category_id,
          slot_date: s.slot_date,
          slot_time: s.slot_time,
          raw_url: target.url,
          provider,
        });
        console.log(`  -> ${r.status} ${r.body.slice(0, 120)}`);
      }
    } catch (e) {
      console.error(`[${provider}][poll] ${target.label} failed:`, e.message);
    } finally {
      await ctx.close();
    }
  }

  const browser = await chromium.launch({ headless: HEADLESS !== 'false' });
  console.log(`[${provider}][start] ${targets.length} targets, every ${POLL_INTERVAL_SEC}s (+jitter ${JITTER_SEC}s)`);

  do {
    await maybeHeartbeat();
    for (const t of targets) await pollTarget(browser, t);
    if (ONCE) break;
    const wait = Number(POLL_INTERVAL_SEC) * 1000 + jitter();
    console.log(`[${provider}][idle] sleeping ${Math.round(wait / 1000)}s`);
    await sleep(wait);
  } while (true);

  await browser.close();
}