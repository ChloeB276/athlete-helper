-- The self-update grant on profiles is a column-level allowlist (see
-- add_onboarding_profile_fields / add_role_to_profiles). The new `sport`
-- column was missing from it, so saving it from Settings failed with
-- "permission denied for table profiles". Re-issue the grant to include it.
revoke update on profiles from authenticated;
grant update (role, positions, strong_foot, onboarding_completed_at, sport)
  on profiles to authenticated;
