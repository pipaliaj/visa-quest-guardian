#!/usr/bin/env node
/**
 * BLS International slot scraper.
 *
 * BLS pages vary by country, often:
 *  - require login or category selection before showing the calendar,
 *  - mark available days with classes like `slot-available`, `green`,
 *  - sit behind Cloudflare — stealth/proxies may be required.
 *
 * Inspect a real page with `HEADLESS=false node scrape-bls.mjs --once` and adjust.
 */
import { runScraper } from './lib/runner.mjs';

async function extractSlots(page) {
  return await page.evaluate(() => {
    const out = [];
    const monthNames = { january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12,
      jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

    const monthHeader = document.querySelector('.ui-datepicker-title, .calendar-title, [class*="month-year"]');
    let activeMonth = null, activeYear = null;
    if (monthHeader) {
      const t = monthHeader.textContent.trim().toLowerCase();
      const mm = t.match(/(\w+)\s+(\d{4})/);
      if (mm && monthNames[mm[1]]) { activeMonth = monthNames[mm[1]]; activeYear = mm[2]; }
    }
    if (activeMonth && activeYear) {
      document.querySelectorAll(
        'td.slot-available, td.availabe, td.available, td.green, td a.day-available, .ui-datepicker-calendar td:not(.ui-datepicker-unselectable) a'
      ).forEach((el) => {
        const day = parseInt((el.textContent || '').trim(), 10);
        if (!day) return;
        out.push({ slot_date: `${activeYear}-${String(activeMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`, slot_time: null });
      });
    }

    document.querySelectorAll('[data-date]').forEach((el) => {
      const date = el.getAttribute('data-date');
      const disabled = el.classList.contains('disabled') || el.hasAttribute('disabled');
      if (!disabled && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        out.push({ slot_date: date, slot_time: el.getAttribute('data-time') || null });
      }
    });

    document.querySelectorAll('select[name*="time"] option, .time-slot-option').forEach((el) => {
      const t = (el.textContent || el.value || '').trim();
      const tm = t.match(/(\d{1,2}):(\d{2})/);
      const dateAttr = el.getAttribute('data-date') || el.closest('[data-date]')?.getAttribute('data-date');
      if (tm && dateAttr && /^\d{4}-\d{2}-\d{2}$/.test(dateAttr)) {
        out.push({ slot_date: dateAttr, slot_time: `${tm[1].padStart(2,'0')}:${tm[2]}` });
      }
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

runScraper({ provider: 'bls', targetsFile: 'targets-bls.json', extractSlots }).catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});