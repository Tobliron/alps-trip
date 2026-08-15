-- Trip HQ — shared data for the Cyprus & Dolomites 2026 page.
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Shared collaborative state: booking ticks, budget figures, packing, events.
-- One row per key; the whole value is stored as JSON.
-- ---------------------------------------------------------------------------
create table if not exists public.trip_state (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- ---------------------------------------------------------------------------
-- Notes: append-only, each one stamped with who wrote it.
-- ---------------------------------------------------------------------------
create table if not exists public.trip_notes (
  id         bigint generated always as identity primary key,
  author     text        not null,
  body       text        not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Activity feed: "Liron ticked Rifugio Lagazuoi", "Yoni changed Flights to 420".
-- ---------------------------------------------------------------------------
create table if not exists public.trip_activity (
  id         bigint generated always as identity primary key,
  author     text        not null,
  action     text        not null,
  created_at timestamptz not null default now()
);

create index if not exists trip_notes_created_idx    on public.trip_notes    (created_at desc);
create index if not exists trip_activity_created_idx on public.trip_activity (created_at desc);

-- ---------------------------------------------------------------------------
-- Access rules.
--
-- DELIBERATELY OPEN: anyone holding the public anon key -- which is embedded in
-- the published page, as that key is designed to be -- can read and write these
-- tables. There are no logins; the author name is self-declared, not verified.
--
-- That is an accepted trade for a three-person trip page where the goal is
-- attribution ("who wrote this note"), not security. If this ever needs to be
-- locked down, replace the `to anon` policies below with ones that require an
-- authenticated user, and add Supabase Auth to the page.
-- ---------------------------------------------------------------------------
alter table public.trip_state    enable row level security;
alter table public.trip_notes    enable row level security;
alter table public.trip_activity enable row level security;

drop policy if exists "anon read state"    on public.trip_state;
drop policy if exists "anon insert state"  on public.trip_state;
drop policy if exists "anon update state"  on public.trip_state;
create policy "anon read state"   on public.trip_state for select to anon using (true);
create policy "anon insert state" on public.trip_state for insert to anon with check (true);
create policy "anon update state" on public.trip_state for update to anon using (true) with check (true);

drop policy if exists "anon read notes"   on public.trip_notes;
drop policy if exists "anon add notes"    on public.trip_notes;
drop policy if exists "anon delete notes" on public.trip_notes;
create policy "anon read notes"   on public.trip_notes for select to anon using (true);
create policy "anon add notes"    on public.trip_notes for insert to anon with check (true);
create policy "anon delete notes" on public.trip_notes for delete to anon using (true);

drop policy if exists "anon read activity"   on public.trip_activity;
drop policy if exists "anon add activity"    on public.trip_activity;
drop policy if exists "anon delete activity" on public.trip_activity;
create policy "anon read activity"   on public.trip_activity for select to anon using (true);
create policy "anon add activity"    on public.trip_activity for insert to anon with check (true);
create policy "anon delete activity" on public.trip_activity for delete to anon using (true);

-- Lets old entries be cleared out (the activity feed is a convenience, not an
-- audit trail) and lets a stale state key be removed rather than just overwritten.
drop policy if exists "anon delete state" on public.trip_state;
create policy "anon delete state" on public.trip_state for delete to anon using (true);
