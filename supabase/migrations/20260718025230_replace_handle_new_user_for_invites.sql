-- When a coach invites a not-yet-registered player by email, we call
-- supabase.auth.admin.inviteUserByEmail() with { data: { invited_team_id } }.
-- Extend handle_new_user() to read that metadata off the new auth.users row
-- and finish the roster add automatically, pre-setting role = 'player' so
-- the invited player skips the role picker in onboarding.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  invited_team_id uuid;
begin
  invited_team_id := (new.raw_user_meta_data ->> 'invited_team_id')::uuid;

  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when invited_team_id is not null then 'player' else null end
  )
  on conflict (id) do nothing;

  if invited_team_id is not null then
    insert into public.team_members (team_id, player_id)
    values (invited_team_id, new.id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;
