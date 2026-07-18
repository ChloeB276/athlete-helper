-- Per-team, per-player, per-date attendance (present/absent). A coach adds
-- a date column via "Add Today" (seeds every roster player as present) and
-- can re-toggle any player's mark for any date afterward — unlike feedback,
-- attendance is editable, not immutable.

-- team_id/player_id reference teams/profiles directly (for Postgrest
-- embedding), plus a composite FK to team_members so a row can only exist
-- for a real roster relationship and auto-cleans up on roster removal.
-- (feedback only grew this second FK after a bug — see
-- 20260718132119_add_feedback_team_fkey.sql — so attendance gets it up front.)
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams (id) on delete cascade,
  player_id uuid not null references profiles (id) on delete cascade,
  date date not null,
  present boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, player_id) references team_members (team_id, player_id) on delete cascade,
  unique (team_id, player_id, date)
);

create index if not exists attendance_team_id_idx on attendance (team_id);
create index if not exists attendance_player_id_idx on attendance (player_id);

alter table attendance enable row level security;

create policy "attendance_select_coach" on attendance
  for select to authenticated
  using (is_coach_of_team(team_id));

create policy "attendance_select_player" on attendance
  for select to authenticated
  using (auth.uid() = player_id);

create policy "attendance_insert_coach" on attendance
  for insert to authenticated
  with check (is_coach_of_team(team_id));

create policy "attendance_update_coach" on attendance
  for update to authenticated
  using (is_coach_of_team(team_id))
  with check (is_coach_of_team(team_id));
