-- Let a coach update the position(s)/strong foot of players on their own
-- roster (previously the only update policy on profiles was self-update).
-- The existing column-level update grant (positions, strong_foot, ...) is
-- to `authenticated` generally; RLS below is what scopes it to roster rows.

create policy "profiles_update_coach_of_roster" on profiles
  for update to authenticated
  using (is_coach_of_player(id))
  with check (is_coach_of_player(id));
