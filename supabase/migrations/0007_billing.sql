-- =============================================================================
-- 0007_billing.sql
-- Extra columns for Stripe subscription state. Run after 0006. Idempotent.
-- =============================================================================

alter table public.subscriptions
  add column if not exists current_period_end   timestamptz,
  add column if not exists cancel_at_period_end  boolean default false;
