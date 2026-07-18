-- Adds a coach/player role to profiles. Role starts null (chosen during
-- onboarding) except for players added via a coach's invite, whose role is
-- set directly by the invite trigger.

alter table profiles add column if not exists role text;

alter table profiles add constraint profiles_role_check
  check (role is null or role in ('coach', 'player'));

-- Re-issue the self-update grant to include the new column, on top of the
-- existing allowlist (positions, strong_foot, onboarding_completed_at).
revoke update on profiles from authenticated;
grant update (role, positions, strong_foot, onboarding_completed_at)
  on profiles to authenticated;
