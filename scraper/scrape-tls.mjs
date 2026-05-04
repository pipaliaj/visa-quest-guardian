#!/usr/bin/env node
/**
 * TLScontact slot scraper.
 * Run: node scrape-tls.mjs [--once]
 */
import { runScraper } from './lib/runner.mjs';

/**
 * TLScontact appointment pages typically render slots as buttons containing
 * a date string like "14 May 2026 - 10:30" inside the calendar widget.
 * Inspect the live DOM with `HEADLESS=false node scrape-tls.mjs --once`
 * and tighten these selectors per centre as needed.
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

    // Strategy 2: visible appointment buttons
    const re = /(\d{1,2})[\s\-/](\w{3,9})[\s\-/](\d{4})(?:\D+(\d{1,2}):(\d{2}))?/;
    const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    document.querySelectorAll('button, a, .appointment-slot, .slot, [class*="slot"]').forEach((el) => {
      const t = (el.textContent || '').trim();
      const m = t.match(re);
      if (!m) return;
      const day = String(m[1]).padStart(2, '0');
      const mon = months[m[2].slice(0, 3).toLowerCase()];
      if (!mon) return;
      const date = `${m[3]}-${String(mon).padStart(2, '0')}-${day}`;
      const time = m[4] && m[5] ? `${m[4].padStart(2, '0')}:${m[5]}` : null;
      out.push({ slot_date: date, slot_time: time });
    });

    const seen = new Set();
    return out.filter((s) => {
      const k = `${s.slot_date}|${s.slot_time || ''}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });
}

runScraper({ provider: 'tls', targetsFile: 'targets-tls.json', extractSlots }).catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});