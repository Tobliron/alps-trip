# Prompt for Claude Code — "Shugon – Trip Planning"

You are working inside my existing repo for https://tobliron.github.io/alps-trip/ (a static single-page "Trip HQ" for a Cyprus & Dolomites trip, Sep 17 – Oct 10 2026, three friends). I want to evolve it into a small multi-trip planning app called **Shugon – Trip Planning**, hosted on GitHub Pages with a free Supabase backend. Start by exploring the repo and summarising what exists (structure, data shape, storage/sync mechanism, styling) before changing anything.

## Goals, in priority order

1. **Rich day view.** The core unit is a day. Each day has an ordered list of activities, and each activity can hold: start time / rough schedule; trailhead, parking, how to get there; distance, elevation gain, duration, difficulty; map link and GPX file; food and water stops; what to book or pay (bookings live here — the separate Bookings tab becomes a cross-trip "unbooked / to-do" filter that reads from days); rain / backup plan; photos; free-text notes; attached files and receipts. Days also carry weather (fetch a free forecast API for the day's location) and their own notes/files.
2. **Easy replanning.** Two ways to edit, both first-class: (a) in-page edit mode with drag-and-drop of activities between days and shifting blocks of days by ±N; (b) one clean, human-readable data file per trip (JSON, versioned in the repo and/or exportable/importable) that mirrors exactly what's in Supabase. Import/export must round-trip losslessly.
3. **Multiple trips.** Trip switcher on the top level; create new blank trip, duplicate a trip or a day. Every trip has its own days, budget, packing, notes, files, dashboard, people.
4. **Supabase backend (free tier).** Postgres for trips/days/activities/notes/activity-log, Storage buckets for photos, receipts, files, GPX. Real-time sync so all three of us see edits live. Row Level Security: reading is public (anon key), writing requires the shared edit password (see below) enforced server-side (e.g. an edge function or RPC that checks the password against a stored hash and issues a short-lived token / signed JWT — never a client-only toggle).
5. **Edit mode behind one shared password.** Everyone can view; entering the single group password unlocks editing on that device (remembered until logout). Keep the existing "who's using this" self-declared name so the activity log still shows who changed what.
6. **Trip map.** A map (Leaflet + OpenStreetMap or similar free tiles) showing bases, activities and routes for the whole trip; clicking a marker opens that day/activity. Show GPX tracks when present.
7. **Offline mode.** PWA / installable: cache the app shell and the current trip's data, images, GPX and confirmations so day views work with no signal (huts). Queue edits made offline and sync when back online, with a simple last-write-wins and a visible "unsynced changes" indicator.
8. **Countdown & Today view.** Before the trip: countdown on the home screen. During the trip: the app opens straight to today's day view with weather and what's booked/outstanding.
9. **Trip dashboard.** Total days, km and elevation gain, budget vs. spent, bookings done vs. missing, days planned vs. empty.
10. **Custom photos.** Let me upload my own photos (trip cover, per day, per activity) to Supabase Storage; replace the Wikimedia stock images with an upload slot and keep the current images only as fallbacks. Keep the photo credit line for any Wikimedia image still in use.
11. **Hebrew.** A language toggle button (EN / עברית) with full RTL layout when Hebrew is on. All UI strings go through an i18n dictionary; user-entered content is left as typed.

## Keep

- The current visual style: elevation-profile hero with clickable phases, photo cards, palette, typography, tone. Extend it, don't restyle it.
- All existing trip content, seeded as the first trip: phases (Cyprus → Cortina → Alta Via 1 huts → Val Gardena → Val di Funes/Lake Garda → Venice), dates, activity bullets, holiday markers (Yom Kippur, Sukkot, Simchat Torah), the "do first" note, handy links, budget table, packing list, calendar events. Migrate this into the new day/activity structure and into the trip JSON file.
- Existing tabs (Overview, Calendar, Budget, Packing, Notes, Activity log) as per-trip sections, plus new: Day view (calendar as a day-by-day display), Map, Dashboard. Bookings merges into days as described.
- Export/import JSON backup.
- Mobile-first: this will mostly be used on phones.

## Working method

- Explore first, then propose a plan: data model (tables + JSON schema), auth/password approach, storage layout, whether the current plain-JS codebase should stay plain or move to a light framework (recommend one and justify — it must still build to static files for GitHub Pages). **Wait for my confirmation before any large rewrite.**
- Then implement in small, committed steps: (1) data model + Supabase schema/migrations + seed of the current trip, (2) trip switcher + day view + edit mode + password, (3) drag-and-drop replanning + JSON round-trip, (4) files/photos/receipts, (5) map + weather, (6) offline/PWA, (7) dashboard/today/countdown, (8) Hebrew/RTL, (9) polish and deploy.
- Give me a short setup checklist for anything I must do myself (create Supabase project, run migrations, set the edit password, add env vars/GitHub secrets, enable Pages).
- Rename the site everywhere (title, meta, header, manifest) to **Shugon – Trip Planning**.
- Don't invent trip facts; if a field is unknown, leave it empty for me to fill.
