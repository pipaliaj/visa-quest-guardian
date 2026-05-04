# TLScontact Slot Scraper (Reference Implementation)

A standalone Node.js + Playwright scraper that polls TLScontact appointment
pages and posts available slots to your `notify.jaypipalia.com` webhook.

> ⚠️ **Unofficial**. This project is not affiliated with TLScontact, the
> French government, or any consulate. Use responsibly and respect rate limits.

---

## What it does

1. Reads a list of `(centre_id, category_id, url)` targets from `targets.json`.
2. Every `POLL_INTERVAL_SEC` seconds, opens each URL in a headless browser.
3. Extracts visible appointment slots (date + time) from the DOM.
4. POSTs each slot to your webhook (`/api/public/slots`) signed with HMAC-SHA256.
5. Sends a heartbeat every 5 minutes so the admin dashboard knows the scraper is alive.

The webhook is idempotent — duplicates are safely ignored.

---

## Setup (Ubuntu VPS, ~5 minutes)

```bash
# 1. Install Node 20 + Playwright deps
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone / copy this folder onto the VPS
cd /opt && sudo mkdir slot-scraper && sudo chown $USER slot-scraper
# scp -r scraper/* user@vps:/opt/slot-scraper/
cd /opt/slot-scraper

# 3. Install
npm install
npx playwright install --with-deps chromium

# 4. Configure
cp .env.example .env
nano .env          # paste WEBHOOK_URL + SCRAPER_KEY
nano targets.json  # add the centre/category UUIDs + TLS URLs to poll

# 5. Test once
node scrape.mjs --once

# 6. Run as a service
sudo cp slot-scraper.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now slot-scraper
sudo journalctl -u slot-scraper -f
```

---

## Generating a scraper key

1. Sign in to your app as an admin.
2. Go to **Dashboard → Admin**.
3. Click **+ New scraper key**, give it a name (e.g. `vps-paris-1`).
4. Copy the key (`ssk_...`) — it's shown **once**. Paste into `.env` as `SCRAPER_KEY`.

---

## Finding centre & category UUIDs

In your app's Supabase database (Lovable Cloud → Database):

```sql
SELECT id, name FROM centres WHERE country_id = (SELECT id FROM countries WHERE code = 'FR');
SELECT id, name FROM categories;
```

Plug those UUIDs into `targets.json` along with the public TLScontact URL for that centre/category combination.

---

## Tuning

| Env var              | Default | Notes                                            |
|----------------------|---------|--------------------------------------------------|
| `POLL_INTERVAL_SEC`  | 90      | Be polite. Don't go below 60.                    |
| `JITTER_SEC`         | 30      | Random delay added per poll to avoid patterns.   |
| `HEARTBEAT_SEC`      | 300     | How often to ping webhook even with no slots.    |
| `HEADLESS`           | true    | Set `false` locally to watch the browser.        |
| `USER_AGENT`         | (real)  | Override if you need to.                         |

---

## Adapting the parser

TLScontact's HTML changes occasionally. If the scraper stops finding slots,
update the `extractSlots()` function in `scrape.mjs` — it currently looks for
common patterns (`.appointment-slot`, `[data-date]`, etc.). Run with
`HEADLESS=false node scrape.mjs --once` to inspect the live DOM.