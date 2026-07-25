-- feedback.team_id previously only had a composite FK to team_members
-- (team_id, player_id), so Postgrest couldn't find a direct relationship to
-- embed teams(name) in feedback queries. Add the direct FK so embedding
-- works; it's implied anyway (team_members.team_id already references
-- teams), so this doesn't change what data is valid.
alter table feedback
  add constraint feedback_team_id_fkey
  foreign key (team_id) references teams (id) on delete cascade;
