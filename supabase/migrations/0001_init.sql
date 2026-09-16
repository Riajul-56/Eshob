-- =============================================================================
-- Loyalty Platform — 0001_init.sql
-- Multi-tenant schema with Row-Level Security (RLS).
--
-- This file is the heart of the product's data isolation (SRS §5). Supabase
-- enforces RLS *inside Postgres*, so even if the app code has a bug, one
-- business can never read another business's data.
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
--   (Later you can switch to the Supabase CLI: `supabase db push`.)
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type public.member_role     as enum ('owner', 'staff');
create type public.approval_mode   as enum ('auto', 'manual');
create type public.campaign_status as enum ('active', 'paused', 'archived');
create type public.sub_status      as enum ('trialing', 'active', 'past_due', 'canceled');
create type public.plan_type       as enum ('monthly', 'yearly', 'lifetime');

-- ---------- helper: keep updated_at fresh ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- businesses = tenants. Each row is one isolated business account.
create table public.businesses (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  category           text,
  logo_url           text,
  redemption_pin_hash text,           -- staff PIN, hashed; set via server action
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- business_members = which auth users can manage which business, and their role.
create table public.business_members (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.member_role not null default 'owner',
  created_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

-- Helper used by every tenant-scoped policy: is the current user a member of
-- this business? SECURITY DEFINER so it can read business_members regardless
-- of the caller's own RLS.
create or replace function public.is_business_member(b_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members
    where business_id = b_id
      and user_id = auth.uid()
  );
$$;

-- campaigns = reward rules ("10 stamps = free coffee").
create table public.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  business_id        uuid not null references public.businesses(id) on delete cascade,
  slug               text not null unique default encode(gen_random_bytes(8), 'hex'),
  name               text not null,
  reward_text        text not null,
  stamps_required    int  not null check (stamps_required > 0),
  stamp_validity_days int,             -- null = stamps never expire
  approval_mode      public.approval_mode   not null default 'auto',
  status             public.campaign_status not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- customers = loyalty end-users. Global identity (a person can belong to many
-- businesses). Access is server-mediated in the MVP (see RLS note below).
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  phone        text,
  email        text,
  name         text,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- memberships = a customer's wallet within one campaign (their stamp count).
create table public.memberships (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  campaign_id   uuid not null references public.campaigns(id) on delete cascade,
  customer_id   uuid not null references public.customers(id) on delete cascade,
  stamp_count   int  not null default 0,
  last_stamp_at timestamptz,
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

-- stamps = immutable ledger of every stamp issued.
create table public.stamps (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  approved      boolean not null default true,
  expires_at    timestamptz,
  source        text not null default 'scan',
  created_at    timestamptz not null default now()
);

-- redemptions = completed cards exchanged for a reward (audit trail).
create table public.redemptions (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  reward_text   text not null,
  approved_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- subscriptions = Stripe billing state per business.
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  business_id            uuid not null unique references public.businesses(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   public.plan_type,
  status                 public.sub_status not null default 'trialing',
  trial_ends_at          timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- audit_logs = who did what (redemptions, PIN changes, data export/delete).
create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  actor       uuid references auth.users(id),
  action      text not null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

-- ---------- updated_at triggers ----------
create trigger t_businesses_updated    before update on public.businesses
  for each row execute function public.set_updated_at();
create trigger t_campaigns_updated     before update on public.campaigns
  for each row execute function public.set_updated_at();
create trigger t_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------- indexes (tenant-first for speed) ----------
create index idx_members_user       on public.business_members(user_id);
create index idx_campaigns_business on public.campaigns(business_id);
create index idx_memberships_business on public.memberships(business_id);
create index idx_stamps_business    on public.stamps(business_id);
create index idx_redemptions_business on public.redemptions(business_id);

-- =============================================================================
-- SECURE BUSINESS CREATION
-- A business must always be created together with an owner membership, so we do
-- it atomically in a SECURITY DEFINER function instead of a plain INSERT policy.
-- =============================================================================
create or replace function public.create_business(p_name text, p_category text default null)
returns public.businesses
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.businesses;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.businesses (name, category)
    values (p_name, p_category)
    returning * into b;

  insert into public.business_members (business_id, user_id, role)
    values (b.id, auth.uid(), 'owner');

  -- start a trial subscription record
  insert into public.subscriptions (business_id, status, trial_ends_at)
    values (b.id, 'trialing', now() + interval '3 days');

  return b;
end;
$$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- Turn RLS on for every table, then grant access only to members of the tenant.
-- =============================================================================
alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;
alter table public.campaigns        enable row level security;
alter table public.customers        enable row level security;
alter table public.memberships      enable row level security;
alter table public.stamps           enable row level security;
alter table public.redemptions      enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.audit_logs       enable row level security;

-- businesses: members can read & update their own business.
-- (Creation is via create_business() only — no INSERT policy on purpose.)
create policy "members read business" on public.businesses
  for select using (public.is_business_member(id));
create policy "members update business" on public.businesses
  for update using (public.is_business_member(id));

-- business_members: a user sees their own memberships; owners manage the team.
create policy "read own memberships" on public.business_members
  for select using (user_id = auth.uid() or public.is_business_member(business_id));
create policy "owners manage members" on public.business_members
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- campaigns: full read/write for members of the owning business.
create policy "members rw campaigns" on public.campaigns
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- memberships / stamps / redemptions: scoped to the owning business.
create policy "members rw memberships" on public.memberships
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
create policy "members rw stamps" on public.stamps
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
create policy "members rw redemptions" on public.redemptions
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

-- subscriptions & audit logs: read-only to members (writes happen server-side).
create policy "members read subscription" on public.subscriptions
  for select using (public.is_business_member(business_id));
create policy "members read audit" on public.audit_logs
  for select using (public.is_business_member(business_id));

-- customers: NO client policy on purpose. With RLS enabled and no permissive
-- policy, all direct client access is denied by default. The public customer
-- journey (scan -> join -> stamp) will run through server actions using the
-- service role or SECURITY DEFINER RPCs, added in the customer milestone.
-- =============================================================================
