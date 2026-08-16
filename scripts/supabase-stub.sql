-- Minimal stand-in for the parts of Supabase the migration touches, so a plain
-- local Postgres can run it. Roles are cluster-wide, hence the guards.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;

grant usage on schema public to anon, authenticated;

create schema if not exists storage;

create table if not exists storage.buckets (
  id               text primary key,
  name             text not null,
  public           boolean default false,
  file_size_limit  bigint
);

create table if not exists storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets(id),
  name       text,
  owner      uuid
);
alter table storage.objects enable row level security;
