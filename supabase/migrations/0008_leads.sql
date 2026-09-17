-- =============================================================================
-- 0008_leads.sql
-- Contact-form submissions from the public landing page. Run after 0007.
-- =============================================================================

create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  business   text,
  message    text,
  source     text default 'landing',
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_created on public.leads (created_at desc);

-- RLS on with NO policies: anon/authenticated can't touch this table at all.
-- Only the server action (service-role key) can insert, and only you can read
-- it from the Supabase dashboard. That keeps the form from being readable or
-- scrapeable by anyone who finds the endpoint.
alter table public.leads enable row level security;
