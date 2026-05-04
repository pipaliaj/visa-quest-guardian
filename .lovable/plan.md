## Next build phase: Trackers + Slot ingestion + Email alerts

Foundation (auth, dashboard shell, marketing) is done. This phase makes the product actually *do something* end-to-end: a user can create a tracker, an admin (or the future scraper) can inject a slot, and matching users get an email instantly.

### 1. Trackers CRUD UI (`/dashboard/trackers`)

- "New tracker" dialog: cascading selects → Country → Centre (filtered by country) → Visa category → optional alert window (days of week + start/end hour).
- Tracker list: card per tracker showing country flag, centre, category, last detected slot, active toggle, delete button.
- Server functions (`src/server/trackers.functions.ts`) for list/create/update/delete using `requireSupabaseAuth` middleware (RLS already enforces user ownership).
- Reference data loader (countries, centres, categories) — public read, fetched via a single server fn.

### 2. Admin panel (`/dashboard/admin`, admin role only)

- Visible only when `has_role(uid, 'admin')` — gate in `beforeLoad` via a server fn.
- "Inject test slot" form: pick centre + category + date/time → inserts into `slot_events` and triggers fanout. Lets us QA the whole pipeline before scrapers exist.
- Scraper keys table: create / revoke / view last heartbeat.
- "Make me admin" one-shot helper (checks if zero admins exist, then grants caller — safe bootstrap).

### 3. Slot ingestion webhook (`/api/public/slots`)

- Server route (TanStack file route, NOT Supabase edge function).
- HMAC-SHA256 verification using header `x-scraper-signature` against per-key secret stored hashed in `scraper_keys`.
- Zod-validated payload: `{ key_id, centre_id, category_id, slot_date, slot_time?, raw_url? }`.
- Inserts into `slot_events` (admin client), updates scraper `last_heartbeat_at` + `last_slot_at`, then enqueues fanout.
- Heartbeat-only mode: same endpoint accepts `{ heartbeat: true }` to update liveness without a slot.
- Dedup: skip insert if same `(centre_id, category_id, slot_date, slot_time)` seen in last 60s.

### 4. Fanout engine + email channel (Resend connector)

- After a slot is inserted, query active trackers matching `centre_id + category_id`, intersect with users whose alert window covers `now()` in Europe/Dublin and whose subscription for that country is active *or* trialing (we'll relax during pre-billing dev).
- For each match → send email via Resend connector (gateway pattern), log to `notifications_log`.
- Dedup per user: skip if a notification for the same `slot_event_id + user_id + channel` already exists.
- Resend connector: prompt user to connect it before this step ships.

### 5. Live status + recent slots on dashboard

- Overview page: replace placeholders with real stats (active trackers, last 24h detected slots, scraper health green/amber/red from `last_heartbeat_at`).
- Per-tracker recent slots feed (last 10) with relative timestamps.
- Realtime subscription on `slot_events` so new detections pop into the UI without refresh + sonner toast + optional sound.

### Technical details

**Files to add**
- `src/server/trackers.functions.ts`, `src/server/reference.functions.ts`, `src/server/admin.functions.ts`, `src/server/slots.server.ts` (fanout helper).
- `src/routes/api/public/slots.ts` (webhook).
- `src/routes/dashboard.admin.tsx`, dialog components in `src/components/trackers/`.
- `src/lib/hmac.ts` (sign/verify helpers using Node `crypto`).

**DB migration**
- Add unique index on `slot_events (centre_id, category_id, slot_date, slot_time, detected_at)` for dedup queries.
- Add `scraper_keys.key_prefix` (text) so the webhook can look up the row before constant-time comparing the hash.
- Insert seed `visa_categories` rows if missing (short-stay, long-stay, work, study).
- Add INSERT policy on `notifications_log` for service role (already implicit, but explicit is clearer); add admin INSERT on `slot_events` (exists) — plus a SECURITY DEFINER RPC `ingest_slot_event` so the webhook stays simple.

**Secrets needed**
- Resend connector (I'll prompt to connect).
- `SCRAPER_WEBHOOK_PEPPER` — added via add_secret, used to hash scraper keys at rest.

### Out of scope this phase (next phases)
- Web push (VAPID + service worker)
- Stripe pay-per-country billing + paywall
- SMS / Telegram / WhatsApp channels
- Crowd-source reports moderation UI

### After approval, build order
1. Migration + seed categories.
2. Reference + tracker server fns and Trackers UI.
3. Admin route + inject-slot form + bootstrap-admin helper.
4. Webhook route + HMAC + fanout helper.
5. Connect Resend + wire email channel.
6. Overview stats + realtime feed.
