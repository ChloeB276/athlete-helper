-- Coach-authored feedback for a player, always run through the AI Gateway.
-- coach_text is shown to the player verbatim. ai_expanded_text is only
-- populated when the coach selects "AI breakdown"; ai_next_steps/ai_drills
-- are always AI-generated regardless of that choice.

-- player_id/coach_id also reference profiles directly (in addition to the
-- composite FK below) so Postgrest can embed profile fields in feedback
-- queries from either the coach or player side.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  player_id uuid not null references profiles (id) on delete cascade,
  coach_id uuid not null references profiles (id) on delete cascade,
  coach_text text not null,
  ai_breakdown_requested boolean not null default false,
  ai_expanded_text text,
  ai_next_steps text[] not null default '{}',
  ai_drills jsonb not null default '[]',
  created_at timestamptz not null default now(),
  foreign key (team_id, player_id) references team_members (team_id, player_id) on delete cascade
);

create index if not exists feedback_player_id_idx on feedback (player_id);
create index if not exists feedback_coach_id_idx on feedback (coach_id);

alter table feedback enable row level security;

create policy "feedback_select_coach" on feedback
  for select to authenticated
  using (auth.uid() = coach_id);

create policy "feedback_select_player" on feedback
  for select to authenticated
  using (auth.uid() = player_id);

create policy "feedback_insert_coach" on feedback
  for insert to authenticated
  with check (auth.uid() = coach_id and is_coach_of_team(team_id));

create policy "feedback_delete_coach" on feedback
  for delete to authenticated
  using (auth.uid() = coach_id);
