# Schengen Visa Slot Tracker (Ireland)

A subscription web app that alerts clients the instant a Schengen visa appointment slot opens at their preferred country's application centre. Pay-per-country billing, multi-channel instant alerts.

## Launch scope

**Countries (top 5 demand from Ireland):**
- France — VFS Global Dublin
- Germany — VFS Global Dublin
- Spain — BLS International Dublin
- Italy — VFS Global Dublin
- Netherlands — VFS Global Dublin

(Easy to add more once the framework is proven.)

## Architecture

Two pieces — only piece 1 is built inside Lovable:

```text
 ┌──────────────────────────┐        slot events (webhook)        ┌──────────────────────────┐
 │  LOVABLE WEB APP         │ ◄─────────────────────────────────  │  EXTERNAL SCRAPER FLEET  │
 │  (this project)          │                                     │  (you deploy on VPS)     │
 │  - Marketing site        │  ─────  health/heartbeat  ───────►  │  - Playwright workers    │
 │  - Auth + dashboard      │                                     │  - Residential proxies   │
 │  - Subscriptions/billing │                                     │  - CAPTCHA solver        │
 │  - Notifications fanout  │                                     │  - One worker per site   │
 └──────────────────────────┘                                     └──────────────────────────┘
```

**Why split?** Lovable's runtime (Cloudflare Workers) cannot run Playwright/headless browsers. Scraping VFS/BLS/TLS reliably needs a real Node host with proxies. We build the brain in Lovable and ship a separate scraper-worker codebase you deploy on a cheap VPS (Hetzner / Railway / Fly.io, ~€10–€30/mo + proxies).

## What gets built in Lovable

### 1. Public marketing site
- Landing page (hero, how-it-works, supported countries, pricing, FAQ, testimonials placeholder)
- Separate routes: `/`, `/how-it-works`, `/pricing`, `/countries`, `/faq`, `/contact`, `/legal/terms`, `/legal/privacy`
- Clear disclaimer: "We are not affiliated with VFS, BLS, TLS, VisaMetric or any consulate."

### 2. Auth & user accounts
- Email/password + Google sign-in (Lovable Cloud auth)
- Profile: name, phone (E.164), Telegram handle, notification channel preferences

### 3. Tracker dashboard
- "My trackers" list — each row = country + visa category + centre
- Add tracker flow: pick country → category (short-stay/long-stay/work/study) → centre → confirm subscription
- Per-tracker controls: pause, edit alert window (e.g. only weekdays 9–18), delete
- Recent slot history feed per tracker (last 30 detections)
- Live "system status" panel showing each scraper's last heartbeat (green/amber/red)

### 4. Multi-channel instant alerts
When the scraper posts a slot event, fan out to every subscribed user via their chosen channels:
- **Web push** (browser notifications, works while tab closed) — Service Worker + VAPID
- **Email** — Resend connector
- **SMS** — Twilio connector (E.164 numbers only; cost-controlled, premium tier only)
- **Telegram** — Telegram bot connector (user links account via `/start <token>`)
- **WhatsApp** — Twilio WhatsApp Business API (premium tier)
- In-app toast + sound when dashboard is open (polling every 10s as fallback)
- Deduplication: same slot signature within 60s sent only once per user

### 5. Pay-per-country billing
Stripe (Lovable's built-in payments):
- Each country = separate monthly subscription (e.g. €19/mo per country)
- Bundle discount: 3+ countries → 20% off, 5 countries → 30% off
- Premium add-on: SMS + WhatsApp alerts (€9/mo flat)
- 24-hour free trial on first country
- Self-serve cancel from dashboard

### 6. Slot ingestion webhook (server route)
- `POST /api/public/slots` — HMAC-signed endpoint the external scrapers call
- Validates signature, parses payload `{country, centre, category, slot_date, slot_time, detected_at, raw_url}`
- Inserts into `slot_events`, triggers fanout to matching active trackers
- Rate-limit per scraper key

### 7. Admin panel (you only)
- View all users, subscriptions, MRR
- Manually inject a test slot event (for QA)
- Per-scraper API keys: create / revoke / view usage
- Block/refund users
- Toggle a country's tracker availability (kill switch if a scraper is down >1h)

### 8. Crowd-source fallback (built-in but optional)
- Logged-in users can report a slot they saw (form: country, centre, screenshot, date/time)
- Auto-flagged as "user-reported" in alerts (lower trust badge)
- Admin one-click promote to verified

## What you build outside Lovable (we'll provide a starter repo spec in the plan, but not the code)

A separate Node + Playwright worker repo. One worker process per site (vfs-france, vfs-germany, bls-spain, …). Each worker:
1. Boots Playwright with a residential proxy (Bright Data / Smartproxy)
2. Logs in with a dummy account where required
3. Polls the calendar endpoint every 30–120s with jittered timing
4. Solves CAPTCHA via 2Captcha when triggered
5. Diffs available dates vs last snapshot
6. POSTs new openings to the Lovable webhook with HMAC signature
7. Sends a heartbeat every 60s

You'll need: a VPS (~€10/mo), residential proxies (~€50–€100/mo at low volume), 2Captcha credits (~€10/mo), and ongoing maintenance time when sites change their HTML.

## Data model (Lovable Cloud / Postgres)

- `profiles` — user details, notification channel preferences
- `user_roles` — admin role (separate table per security best practices)
- `countries` — id, name, code, active flag
- `centres` — id, country_id, city, provider (vfs/bls/tls/visametric), provider_url
- `visa_categories` — short-stay, long-stay, work, study
- `trackers` — user_id, centre_id, category_id, active, alert_window_json, created_at
- `subscriptions` — user_id, country_id, stripe_subscription_id, status, current_period_end
- `slot_events` — centre_id, category_id, slot_date, slot_time, detected_at, source (scraper/user), scraper_id
- `notifications_log` — user_id, slot_event_id, channel, sent_at, status
- `scraper_keys` — name, hashed_key, last_heartbeat_at, last_slot_at, active
- `push_subscriptions` — user_id, endpoint, p256dh, auth (Web Push)
- `slot_reports` — user submissions awaiting verification

All tables RLS-protected; users only read their own trackers/subscriptions/notifications.

## UX & visual direction

Trustworthy, calm, fintech-adjacent (not flashy). Off-white background, deep navy primary, single accent (emerald for "slot open"). Inter font. Generous whitespace. Real-time elements (status dots, last-seen timestamps) are first-class — users need to feel the system is alive and watching.

## Out of scope for v1

- Auto-booking slots on user's behalf (very high legal risk — different conversation)
- Mobile native apps (PWA + push covers it)
- Refund automation (manual via Stripe dashboard)
- Multi-currency (EUR only)

## What I need from you before/after build

- Stripe payments connector (set up in-app)
- Resend connector for email
- Twilio connector for SMS/WhatsApp
- Telegram bot token
- Web Push VAPID keys (I'll generate a script)
- A scraper webhook secret (I'll generate)
- A separate decision on whether you'll run the scraper VPS yourself or hire someone

## Build order (so you can see progress fast)

1. Marketing site + auth + dashboard shell
2. Trackers CRUD + slot_events table + admin "inject test slot" button
3. Webhook endpoint + fanout engine + email channel (Resend)
4. Web push + in-app toast
5. Stripe pay-per-country billing + paywall on tracker creation
6. SMS / Telegram / WhatsApp channels
7. Crowd-source reports + admin moderation
8. Polish, legal pages, status page

After approval, I'll start at step 1.
