-- NOT EXECUTABLE until the placeholder is replaced after identity verification.
-- Keep the resolved owner UUID out of public source; run through an approved,
-- privileged database session after reviewing owner-only-access.sql.
begin;
insert into private.admin_users (user_id)
select id from auth.users
where id = 'REPLACE_WITH_VERIFIED_OWNER_UUID'::uuid
  and email_confirmed_at is not null;
-- Operator must verify exactly one membership row was inserted before COMMIT.
-- This template intentionally defaults to rollback and seeds no real identity.
rollback;
