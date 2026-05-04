#!/usr/bin/env node
/**
 * VFS Global slot scraper.
 *
 * VFS Global appointment pages typically:
 *  - require selecting visa type / sub-type / centre via dropdowns first,
 *  - load the calendar grid via XHR after those selections,
 *  - render available days with classes like `available`, `enabled`, `day-available`,
 *  - reveal time slots only after clicking a day.
 *
 * Inspect a real page with `HEADLESS=false node scrape-vfs.mjs --once` and adjust.
 */
import { runScraper } from './lib/runner.mjs';

async function extractSlots(page) {
  return await page.evaluate(() => {
    const out = [];
    const monthNames = { january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12,
      jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

    document.querySelectorAll('[data-date], [data-day], [data-slot-date]').forEach((el) => {
      const raw = el.getAttribute('data-date') || el.getAttribute('data-slot-date') || el.getAttribute('data-day');
      if (!raw) return;
      if (el.classList.contains('disabled') || el.hasAttribute('disabled')) return;
      const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) out.push({ slot_date: `${m[1]}-${m[2]}-${m[3]}`, slot_time: el.getAttribute('data-time') || null });
    });

    const monthHeader = document.querySelector('.calendar-header, .month-name, [class*="month"]');
    let activeMonth = null, activeYear = null;
    if (monthHeader) {
      const t = monthHeader.textContent.trim().toLowerCase();
      const mm = t.match(/(\w+)\s+(\d{4})/);
      if (mm && monthNames[mm[1]]) { activeMonth = monthNames[mm[1]]; activeYear = mm[2]; }
    }
    if (activeMonth && activeYear) {
      document.querySelectorAll('td.available, td.day-available, button.available, .calendar-day.available').forEach((el) => {
        const day = parseInt((el.textContent || '').trim(), 10);
        if (!day) return;
        out.push({ slot_date: `${activeYear}-${String(activeMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`, slot_time: null });
      });
    }

    document.querySelectorAll('.time-slot, button[class*="time"], [data-slot-time]').forEach((el) => {
      const t = (el.textContent || '').trim();
      const tm = t.match(/(\d{1,2}):(\d{2})/);
      const dateAttr = el.getAttribute('data-slot-date') || el.closest('[data-slot-date]')?.getAttribute('data-slot-date');
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

runScraper({ provider: 'vfs', targetsFile: 'targets-vfs.json', extractSlots }).catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});