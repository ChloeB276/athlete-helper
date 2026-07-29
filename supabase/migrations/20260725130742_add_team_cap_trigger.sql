-- Enforces the free-tier "1 team per coach" limit at the database layer,
-- not just in the createTeam server action, so two concurrent inserts
-- can't both pass a stale application-level count check. Admins and
-- coaches with an active/trialing subscription are unlimited. Existing
-- teams are never touched by this trigger -- it only blocks *creating*
-- a new team while already at/over the free limit, so a downgrade never
-- locks a coach out of teams they already made.

create function enforce_team_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subscribed boolean;
  v_existing_count integer;
begin
  -- Serializes concurrent inserts for the same coach (without a
  -- table-wide lock) so the count read below can't race.
  perform pg_advisory_xact_lock(hashtext(new.coach_id::text));

  select exists (
    select 1 from profiles where id = new.coach_id and is_admin
    union
    select 1 from subscriptions
    where user_id = new.coach_id and status in ('active', 'trialing')
  ) into v_subscribed;

  if not v_subscribed then
    select count(*) into v_existing_count
    from teams where coach_id = new.coach_id;

    if v_existing_count >= 1 then
      raise exception 'FREE_TEAM_LIMIT_REACHED'
        using hint = 'Upgrade to create additional teams.';
    end if;
  end if;

  return new;
end;
$$;

create trigger teams_enforce_cap
  before insert on teams
  for each row execute function enforce_team_cap();
