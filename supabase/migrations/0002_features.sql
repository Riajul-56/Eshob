-- =============================================================================
-- 0002_features.sql
-- Adds fields for: rich offers, business profile, location & hours,
-- geofencing, remote scan, compulsory approval, branches, social links.
-- Run in Supabase SQL Editor after 0001. Safe to re-run (idempotent).
-- =============================================================================

-- ---- businesses: profile, location, hours, toggles ----
alter table public.businesses
  add column if not exists phone               text,
  add column if not exists email               text,
  add column if not exists address             text,
  add column if not exists lat                 double precision,
  add column if not exists lng                 double precision,
  add column if not exists geofence_radius     int     default 200,
  add column if not exists open_from           text,          -- "09:00"
  add column if not exists close_at            text,          -- "22:00"
  add column if not exists open_daily          boolean default true,
  add column if not exists allow_remote_scan   boolean default false,
  add column if not exists compulsory_approval boolean default false,
  add column if not exists social_links        jsonb   default '{}'::jsonb;

-- ---- campaigns (offers): image + reward expiry ----
alter table public.campaigns
  add column if not exists reward_image_url   text,
  add column if not exists reward_expiry_days int;

-- ---- branches (create if it doesn't exist yet) ----
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name        text not null,
  address     text,
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now()
);

create index if not exists idx_branches_business on public.branches(business_id);

alter table public.branches enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'branches'
      and policyname = 'members rw branches'
  ) then
    create policy "members rw branches" on public.branches
      for all using (public.is_business_member(business_id))
      with check (public.is_business_member(business_id));
  end if;
end $$;
