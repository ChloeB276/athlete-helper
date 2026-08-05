-- Allow coaches to update their own feedback rows, so they can edit the
-- AI-generated drills after reviewing them.
create policy feedback_update_coach on feedback
  for update
  to authenticated
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id and is_coach_of_team(team_id));
