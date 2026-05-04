## Status: Tracker pipeline shipped

- [x] Migration: dedup index, key_prefix index, seed categories, match_trackers_for_slot fn
- [x] Trackers UI (create, list, toggle, delete)
- [x] Settings (channel toggles, profile)
- [x] Admin page (bootstrap, inject test slot, scraper key issue/list)
- [x] Public scraper webhook /api/public/slots (HMAC + dedup + heartbeat)
- [x] Fanout helper (logs queued notifications)
- [x] Overview (live stats, recent slots, admin link)

## Pending
- Email domain setup → then wire actual email send in fanoutSlotEvent
- Web push (VAPID + service worker)
- Stripe billing + paywall
- Realtime slot feed on overview
