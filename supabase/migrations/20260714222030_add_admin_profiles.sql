-- Adds a profiles table (mirroring auth.users) with an is_admin flag, so the
-- app can show an admin-only page listing users and their drills without
-- needing direct access to the auth.users table.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select to authenticated
  using (auth.uid() = id);

create policy "profiles_select_admin" on profiles
  for select to authenticated
  using (
    exists (
      select 1 from profiles admin_row
      where admin_row.id = auth.uid() and admin_row.is_admin
    )
  );

-- Keep profiles in sync with new signups.
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Backfill profiles for users that already signed up before this migration.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Grant the initial admin.
update profiles set is_admin = true where email = 'chloeboulliung@gmail.com';

-- Let admins read every user's folders/chats/messages/drills for the admin page.
create policy "folders_select_admin" on folders
  for select to authenticated
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin
    )
  );

create policy "chats_select_admin" on chats
  for select to authenticated
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin
    )
  );

create policy "chat_messages_select_admin" on chat_messages
  for select to authenticated
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin
    )
  );

create policy "drills_select_admin" on drills
  for select to authenticated
  using (
    exists (
      select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin
    )
  );
