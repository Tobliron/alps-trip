-- ===========================================================================
-- Shugon – Trip Planning : core schema
--
-- Run this in Supabase -> SQL Editor -> New query -> Run. Safe to re-run.
--
-- This ADDS the new multi-trip tables. It does not touch or drop the original
-- trip_state / trip_notes / trip_activity tables -- those keep the current
-- live site working until the new app replaces it. They get dropped in a
-- later migration, once the new data is verified.
-- ===========================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- trips
-- ---------------------------------------------------------------------------
create table if not exists public.trips (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text,
  start_date  date,
  end_date    date,
  cover_path  text,                       -- storage path, null = use fallback image
  archived    boolean not null default false,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- people (per trip, so a future trip can have a different group)
-- ---------------------------------------------------------------------------
create table if not exists public.people (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  name        text not null,
  avatar_path text,                       -- storage path, data-URI avatars migrate here
  colour      text,
  sort_order  int not null default 0,
  unique (trip_id, name)
);

-- ---------------------------------------------------------------------------
-- days -- the core unit
-- ---------------------------------------------------------------------------
create table if not exists public.days (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  date          date not null,
  title         text,                     -- "Hut day 3: -> Rif. Lagazuoi"
  base_location text,                     -- where you sleep that night
  lat           numeric(9,6),             -- for the weather lookup + map
  lon           numeric(9,6),
  phase         text,                     -- cyprus / cortina / huts / gardena / garda / venice
  holiday       text,                     -- "Yom Kippur", "Sukkot I", ...
  notes         text,
  weather_cache jsonb,                    -- last fetched forecast + fetched_at
  unique (trip_id, date)
);

-- ---------------------------------------------------------------------------
-- activities, ordered within a day. sort_order is what drag-and-drop writes.
-- ---------------------------------------------------------------------------
create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  -- null day_id = unscheduled: it belongs to the trip but has no date yet.
  -- This is the backlog the "to book / to do" list reads from, and the pile
  -- drag-and-drop drags out of onto a day.
  day_id       uuid references public.days(id) on delete set null,
  sort_order   int  not null default 0,
  title        text not null,
  kind         text,                      -- hike / flight / drive / plan / food / rest
  start_time   time,
  duration_min int,

  -- getting there
  trailhead    text,
  parking      text,
  transport    text,

  -- the walk
  distance_km  numeric(6,2),
  ascent_m     int,
  descent_m    int,
  difficulty   text,
  map_url      text,
  gpx_path     text,                      -- storage path

  -- practicalities
  food_water   text,
  backup_plan  text,                      -- the rain plan
  notes        text,

  -- bookings live on the activity. The Bookings view is a filter over this.
  booking      jsonb,                     -- {needed, status, cost, currency, ref, url, due, note}

  created_at   timestamptz not null default now()
);

create index if not exists activities_day_idx     on public.activities (day_id, sort_order);
create index if not exists activities_trip_idx    on public.activities (trip_id);
create index if not exists days_trip_date_idx     on public.days (trip_id, date);
create index if not exists activities_booking_idx on public.activities using gin (booking);

-- The Bookings tab becomes this: everything still outstanding, across trips.
create or replace view public.outstanding_bookings as
select a.id, a.trip_id, a.day_id, d.date, a.title, a.booking
from public.activities a
left join public.days d on d.id = a.day_id
where a.booking is not null
  and coalesce(a.booking->>'needed','false') = 'true'
  and coalesce(a.booking->>'status','todo') <> 'done';

grant select on public.outstanding_bookings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- budget / packing -- rows now, not positional arrays
-- ---------------------------------------------------------------------------
create table if not exists public.budget_items (
  id            uuid primary key default gen_random_uuid(),
  trip_id       uuid not null references public.trips(id) on delete cascade,
  label         text not null,
  est_amount    numeric(10,2),
  actual_amount numeric(10,2),
  currency      text not null default 'EUR',
  note          text,
  sort_order    int not null default 0
);

create table if not exists public.packing_items (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  group_name text not null,
  label      text not null,
  packed     boolean not null default false,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- notes -- trip-level, or attached to a day or an activity
-- ---------------------------------------------------------------------------
create table if not exists public.trip_notes_v2 (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips(id) on delete cascade,
  day_id      uuid references public.days(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  author      text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists trip_notes_v2_idx on public.trip_notes_v2 (trip_id, created_at desc);

-- ---------------------------------------------------------------------------
-- files -- photos, receipts, confirmations, GPX. Bytes live in Storage.
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  day_id       uuid references public.days(id) on delete cascade,
  activity_id  uuid references public.activities(id) on delete cascade,
  kind         text not null,             -- photo / gpx / receipt / doc
  bucket       text not null,             -- trip-media (public) / trip-docs (private)
  storage_path text not null,
  filename     text,
  bytes        bigint,
  uploaded_by  text,
  created_at   timestamptz not null default now()
);

create index if not exists files_trip_idx on public.files (trip_id, kind);

-- ---------------------------------------------------------------------------
-- activity log -- who changed what
-- ---------------------------------------------------------------------------
create table if not exists public.change_log (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid references public.trips(id) on delete cascade,
  author     text not null,
  action     text not null,
  entity     text,
  entity_id  uuid,
  created_at timestamptz not null default now()
);

create index if not exists change_log_idx on public.change_log (trip_id, created_at desc);

-- ===========================================================================
-- Row Level Security
--
-- Reading is public: the anon key in the published page can select everything.
-- Writing requires a real Supabase Auth session, unlocked by the group
-- password behind the Edit button. This is enforced here, by Postgres, not by
-- hiding buttons in the UI: an unauthenticated caller hitting the REST API
-- directly is refused.
--
-- No apostrophes in these comments, deliberately. The Supabase SQL editor
-- splits a script into statements itself, and its splitter treats an
-- apostrophe inside a -- comment as the start of a string literal, which
-- swallows everything up to the next quote and derails the parse.
-- ===========================================================================
-- Written out one table at a time rather than looped in a DO block. A DO block
-- needs dollar quoting, and the Supabase SQL editor splits a pasted script with
-- a parser that does not reliably respect it, cutting the block at the
-- semicolons inside. Repetitive, but it survives any statement splitter.

alter table public.trips enable row level security;
drop policy if exists "public read" on public.trips;
create policy "public read" on public.trips for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.trips;
create policy "editors write" on public.trips for all to authenticated using (true) with check (true);

alter table public.people enable row level security;
drop policy if exists "public read" on public.people;
create policy "public read" on public.people for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.people;
create policy "editors write" on public.people for all to authenticated using (true) with check (true);

alter table public.days enable row level security;
drop policy if exists "public read" on public.days;
create policy "public read" on public.days for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.days;
create policy "editors write" on public.days for all to authenticated using (true) with check (true);

alter table public.activities enable row level security;
drop policy if exists "public read" on public.activities;
create policy "public read" on public.activities for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.activities;
create policy "editors write" on public.activities for all to authenticated using (true) with check (true);

alter table public.budget_items enable row level security;
drop policy if exists "public read" on public.budget_items;
create policy "public read" on public.budget_items for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.budget_items;
create policy "editors write" on public.budget_items for all to authenticated using (true) with check (true);

alter table public.packing_items enable row level security;
drop policy if exists "public read" on public.packing_items;
create policy "public read" on public.packing_items for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.packing_items;
create policy "editors write" on public.packing_items for all to authenticated using (true) with check (true);

alter table public.trip_notes_v2 enable row level security;
drop policy if exists "public read" on public.trip_notes_v2;
create policy "public read" on public.trip_notes_v2 for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.trip_notes_v2;
create policy "editors write" on public.trip_notes_v2 for all to authenticated using (true) with check (true);

alter table public.files enable row level security;
drop policy if exists "public read" on public.files;
create policy "public read" on public.files for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.files;
create policy "editors write" on public.files for all to authenticated using (true) with check (true);

alter table public.change_log enable row level security;
drop policy if exists "public read" on public.change_log;
create policy "public read" on public.change_log for select to anon, authenticated using (true);
drop policy if exists "editors write" on public.change_log;
create policy "editors write" on public.change_log for all to authenticated using (true) with check (true);
