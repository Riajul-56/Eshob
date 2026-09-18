-- =============================================================================
-- 0009_card_required.sql
-- A card is now collected at signup, before the 3-day trial starts.
-- Run after 0008. Safe to run more than once.
--
-- Two changes:
--   1. subscriptions.card_added_at — when a payment method was first put on
--      file. NULL means "still in onboarding"; the app sends those owners to
--      /setup/billing instead of the dashboard.
--   2. create_business() no longer sets trial_ends_at. The trial clock now
--      starts in Stripe, at the moment the card is accepted, and is written
--      back by the checkout return route / webhook.
-- =============================================================================

alter table public.subscriptions
  add column if not exists card_added_at timestamptz;

-- Businesses that signed up under the old "no card needed" terms keep their
-- access — we don't lock anyone out retroactively. New rows created by the
-- function below have no trial clock and no Stripe record, so re-running this
-- migration will not grandfather them by mistake.
update public.subscriptions
   set card_added_at = coalesce(created_at, now())
 where card_added_at is null
   and (trial_ends_at is not null
        or stripe_customer_id is not null
        or plan is not null);

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

  -- Billing row only. trial_ends_at stays null until Stripe confirms a card,
  -- so nobody gets 3 free days simply by creating an account.
  insert into public.subscriptions (business_id, status, trial_ends_at)
    values (b.id, 'trialing', null);

  return b;
end;
$$;
