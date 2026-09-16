-- =============================================================================
-- 0006_menu.sql
-- Digital menu: the same QR can open the business's menu.
-- Run after 0005. Idempotent. (Public menu page reads via the service role,
-- so no public SELECT policy is needed — members manage their own items.)
-- =============================================================================

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category    text,
  name        text not null,
  description text,
  price       numeric(10, 2),
  image_url   text,
  sort_order  int  not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_menu_items_business on public.menu_items(business_id);

alter table public.menu_items enable row level security;

drop policy if exists "members rw menu" on public.menu_items;
create policy "members rw menu" on public.menu_items
  for all using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
