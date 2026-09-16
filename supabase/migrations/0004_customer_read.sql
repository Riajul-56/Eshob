-- =============================================================================
-- 0004_customer_read.sql
-- Let a business owner READ the customers who belong to their business
-- (via a membership), so names/phones show in the dashboard & exports.
-- Isolation is preserved: an owner can only read customers that have a
-- membership in a business they are a member of. Run after 0003. Idempotent.
-- =============================================================================

drop policy if exists "members read their customers" on public.customers;
create policy "members read their customers" on public.customers
  for select using (
    exists (
      select 1 from public.memberships m
      where m.customer_id = customers.id
        and public.is_business_member(m.business_id)
    )
  );
