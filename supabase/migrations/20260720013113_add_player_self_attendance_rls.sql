-- Players can now self-report their own attendance (previously coach-only).
-- These policies add a second write path scoped strictly to the caller's
-- own row, on top of the existing coach-only insert/update policies.
create policy "attendance_insert_player" on attendance
  for insert to authenticated
  with check (auth.uid() = player_id and is_team_member(team_id));

create policy "attendance_update_player" on attendance
  for update to authenticated
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);
