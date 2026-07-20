-- The self-update grant on profiles is a column-level allowlist (see
-- add_onboarding_profile_fields / add_role_to_profiles / add_sport_to_profiles_update_grant).
-- Re-issue it to include the new `equipment` column.
revoke update on profiles from authenticated;
grant update (role, positions, strong_foot, onboarding_completed_at, sport, equipment)
  on profiles to authenticated;
