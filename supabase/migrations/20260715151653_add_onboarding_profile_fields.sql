-- Adds the fields captured by the post-signup onboarding step (positions
-- played, strong/weak foot) plus a timestamp marking onboarding as done.

alter table profiles add column if not exists positions text[] not null default '{}';
alter table profiles add column if not exists strong_foot text;
alter table profiles add column if not exists weak_foot text;
alter table profiles add column if not exists onboarding_completed_at timestamptz;

alter table profiles add constraint profiles_strong_foot_check
  check (strong_foot is null or strong_foot in ('left', 'right'));
alter table profiles add constraint profiles_weak_foot_check
  check (weak_foot is null or weak_foot in ('left', 'right'));

-- Users may update their own onboarding fields, but not their email or
-- is_admin flag — restrict which columns the update grant covers so that's
-- enforced even though the row-level policy only checks ownership.
revoke update on profiles from authenticated;
grant update (positions, strong_foot, weak_foot, onboarding_completed_at)
  on profiles to authenticated;

create policy "profiles_update_own" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
