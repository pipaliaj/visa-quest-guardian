/**
 * Fetches a one-time passcode (OTP) from an IMAP inbox.
 *
 * Strategy:
 *  1. Connect via IMAP (TLS).
 *  2. Open INBOX, poll every 3s for unseen messages newer than `since`.
 *  3. For each candidate, parse with mailparser, run optional from/subject filters,
 *     extract the first 4-8 digit numeric code from text or HTML body.
 *  4. Mark the message as Seen so we don't reprocess it.
 *  5. Return the OTP string, or throw on timeout.
 */
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const {
  IMAP_HOST,
  IMAP_PORT = '993',
  IMAP_USER,
  IMAP_PASS,
  IMAP_TLS = 'true',
  OTP_FROM_FILTER = '',
  OTP_SUBJECT_FILTER = '',
} = process.env;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractOtp(text) {
  if (!text) return null;
  // Common shapes: "Your OTP is 123456", "Verification code: 123456".
  const labelled = text.match(/(?:otp|code|passcode|password)[^\d]{0,20}(\d{4,8})/i);
  if (labelled) return labelled[1];
  const generic = text.match(/\b(\d{6})\b/) || text.match(/\b(\d{4,8})\b/);
  return generic ? generic[1] : null;
}

function matchesFilters(envelope) {
  const fromOk = !OTP_FROM_FILTER ||
    (envelope.from || []).some((a) =>
      `${a.name || ''} ${a.address || ''}`.toLowerCase().includes(OTP_FROM_FILTER.toLowerCase())
    );
  const subjOk = !OTP_SUBJECT_FILTER ||
    (envelope.subject || '').toLowerCase().includes(OTP_SUBJECT_FILTER.toLowerCase());
  return fromOk && subjOk;
}

/**
 * Wait for an OTP email to arrive after `since`.
 * @param {{ since: Date, timeoutMs: number, pollMs?: number }} opts
 * @returns {Promise<string>} the OTP digits
 */
export async function waitForOtp({ since, timeoutMs, pollMs = 3000 }) {
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
    throw new Error('IMAP_HOST / IMAP_USER / IMAP_PASS not configured');
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: Number(IMAP_PORT),
    secure: IMAP_TLS !== 'false',
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  });

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  const deadline = Date.now() + timeoutMs;

  try {
    while (Date.now() < deadline) {
      // Search unseen messages received since `since`
      const uids = await client.search({ seen: false, since });
      if (uids && uids.length > 0) {
        // Process newest first
        for (const uid of uids.slice().reverse()) {
          const msg = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
          if (!msg || !msg.envelope) continue;
          if (!matchesFilters(msg.envelope)) continue;

          const parsed = await simpleParser(msg.source);
          const otp = extractOtp(parsed.text) || extractOtp(parsed.html);
          if (otp) {
            // Mark seen so we don't re-use it
            try { await client.messageFlagsAdd(uid, ['\\Seen'], { uid: true }); } catch {}
            return otp;
          }
        }
      }
      await sleep(pollMs);
    }
    throw new Error(`OTP not received within ${Math.round(timeoutMs / 1000)}s`);
  } finally {
    try { lock.release(); } catch {}
    try { await client.logout(); } catch {}
  }
}