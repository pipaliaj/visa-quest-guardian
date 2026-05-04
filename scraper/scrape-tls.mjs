#!/usr/bin/env node
/**
 * TLScontact slot scraper.
 * Run: node scrape-tls.mjs [--once]
 */
import { runScraper } from './lib/runner.mjs';
import { waitForOtp } from './lib/otp-imap.mjs';

const OTP_WAIT_SEC = Number(process.env.OTP_WAIT_SEC || '120');

/**
 * TLScontact login: email + password, optional email OTP.
 * Selectors are best-effort; tweak per the actual page once observed.
 */
async function login(page, _target, credential) {
  const emailSel = 'input[type="email"], input[name*="mail" i], input[id*="mail" i], input[name="username"]';
  const passSel  = 'input[type="password"], input[name*="pass" i], input[id*="pass" i]';
  const submitSel = 'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")';

  const cookieBtn = await page.$('button:has-text("Accept"), button:has-text("Agree"), #onetrust-accept-btn-handler');
  if (cookieBtn) { try { await cookieBtn.click({ timeout: 2000 }); } catch {} }

  const email = await page.waitForSelector(emailSel, { timeout: 15000 });
  await email.fill(credential.username);

  const pass = await page.waitForSelector(passSel, { timeout: 5000 });
  await pass.fill(credential.password);

  const captcha = await page.$('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], [class*="captcha"]');
  if (captcha) {
    console.warn('[tls][login] captcha detected — manual solve required');
    throw new Error('CAPTCHA_REQUIRED');
  }

  const submit = await page.waitForSelector(submitSel, { timeout: 5000 });
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}),
    submit.click(),
  ]);

  const otpSel = 'input[name*="otp" i], input[id*="otp" i], input[name*="code" i]';
  const otpField = await page.$(otpSel);
  if (otpField) {
    console.log('[tls][login] OTP screen detected, polling inbox...');
    const submittedAt = new Date(Date.now() - 30_000);
    let otp;
    try {
      otp = await waitForOtp({ since: submittedAt, timeoutMs: OTP_WAIT_SEC * 1000 });
    } catch (e) {
      console.error('[tls][login] OTP fetch failed:', e.message);
      throw new Error('OTP_FETCH_FAILED');
    }
    console.log(`[tls][login] got OTP (${otp.length} digits), submitting...`);
    await otpField.fill(otp);

    const otpSubmitSel = 'button[type="submit"], button:has-text("Verify"), button:has-text("Submit"), button:has-text("Continue")';
    const otpSubmit = await page.waitForSelector(otpSubmitSel, { timeout: 5000 });
    await Promise.all([
      page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {}),
      otpSubmit.click(),
    ]);
  }
}

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

runScraper({ provider: 'tls', targetsFile: 'targets-tls.json', extractSlots, login }).catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});