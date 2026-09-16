-- =============================================================================
-- 0005_scratch.sql
-- Digital scratch cards: a chance to win a surprise prize on a scan.
-- Run after 0004. Idempotent.
-- =============================================================================

alter table public.businesses
  add column if not exists scratch_enabled boolean default false,
  add column if not exists scratch_chance  int     default 20;   -- % chance per scan

create table if not exists public.scratch_prizes (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  label       text not null,
  weight      int  not null default 1,      -- relative odds
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_scratch_prizes_business on public.scratch_prizes(business_id);

create table if not exists public.scratch_wins (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  prize_label text not null,
  revealed    boolean not null default false,
  claimed     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_scratch_wins_business on public.scratch_wins(business_id);
create index if not exists idx_scratch_wins_customer on public.scratch_wins(customer_id);

alter table public.scratch_prizes enable row level security;
alter table public.scratch_wins   enable row level security;

drop policy if exists "members rw scratch_prizes" on public.scratch_prizes;
create policy "members rw scratch_prizes" on public.scratch_prizes
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- wins: members manage (customer reveal happens server-side via service role)
drop policy if exists "members rw scratch_wins" on public.scratch_wins;
create policy "members rw scratch_wins" on public.scratch_wins
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
