-- Teams (owned by a coach) and team_members (the roster: which players
-- belong to which teams). A coach can manage multiple teams; a player can
-- belong to multiple teams.

-- coach_id/player_id reference profiles (not auth.users directly) so
-- Postgrest can embed profile fields (email) in roster/team queries.
-- profiles.id already cascades from auth.users, so this is equivalent.
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  team_id uuid not null references teams (id) on delete cascade,
  player_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, player_id)
);

create index if not exists team_members_player_id_idx on team_members (player_id);

-- security definer helpers so RLS policies below don't need to
-- self-reference teams/team_members inline (same pattern as is_admin()).
create function is_coach_of_team(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from teams
    where teams.id = target_team_id and teams.coach_id = auth.uid()
  );
$$;

grant execute on function is_coach_of_team(uuid) to authenticated;

create function is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from team_members
    where team_members.team_id = target_team_id
      and team_members.player_id = auth.uid()
  );
$$;

grant execute on function is_team_member(uuid) to authenticated;

create function is_coach_of_player(target_player_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from team_members
    join teams on teams.id = team_members.team_id
    where team_members.player_id = target_player_id
      and teams.coach_id = auth.uid()
  );
$$;

grant execute on function is_coach_of_player(uuid) to authenticated;

-- Coaches can view the profile (email) of players on their own rosters —
-- profiles otherwise only exposes a user's own row.
create policy "profiles_select_coach_of_roster" on profiles
  for select to authenticated
  using (is_coach_of_player(id));

create function is_my_coach(target_coach_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from team_members
    join teams on teams.id = team_members.team_id
    where teams.coach_id = target_coach_id
      and team_members.player_id = auth.uid()
  );
$$;

grant execute on function is_my_coach(uuid) to authenticated;

-- Players can view the profile (email) of coaches of teams they belong to.
create policy "profiles_select_player_of_coach" on profiles
  for select to authenticated
  using (is_my_coach(id));

alter table teams enable row level security;

create policy "teams_select_coach" on teams
  for select to authenticated
  using (auth.uid() = coach_id);

create policy "teams_select_member" on teams
  for select to authenticated
  using (is_team_member(id));

create policy "teams_insert_own" on teams
  for insert to authenticated
  with check (auth.uid() = coach_id);

create policy "teams_update_own" on teams
  for update to authenticated
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create policy "teams_delete_own" on teams
  for delete to authenticated
  using (auth.uid() = coach_id);

alter table team_members enable row level security;

create policy "team_members_select_own" on team_members
  for select to authenticated
  using (auth.uid() = player_id);

create policy "team_members_select_coach" on team_members
  for select to authenticated
  using (is_coach_of_team(team_id));

create policy "team_members_insert_coach" on team_members
  for insert to authenticated
  with check (is_coach_of_team(team_id));

create policy "team_members_delete_coach" on team_members
  for delete to authenticated
  using (is_coach_of_team(team_id));
