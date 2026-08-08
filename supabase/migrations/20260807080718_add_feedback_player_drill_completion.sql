-- Let players mark the AI-generated drills from their coach's feedback as
-- done (a "completed" flag stored per-drill inside the ai_drills jsonb
-- array). Restrict updatable columns to ai_drills only, so neither a coach
-- nor a player can rewrite the other columns (coach_text, coach_id, etc.)
-- through this same update path.
revoke update on feedback from authenticated;
grant update (ai_drills) on feedback to authenticated;

create policy feedback_update_player on feedback
  for update
  to authenticated
  using (auth.uid() = player_id)
  with check (auth.uid() = player_id);
