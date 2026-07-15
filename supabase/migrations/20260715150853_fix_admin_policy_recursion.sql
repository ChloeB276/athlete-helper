-- The admin select policies added in add_admin_profiles queried `profiles`
-- from within a policy on `profiles` itself, which Postgres has to
-- re-evaluate recursively and errors with "infinite recursion detected in
-- policy for relation \"profiles\"". Replace the self-referencing subqueries
-- with a security definer helper function, which bypasses RLS internally
-- and breaks the recursion.

create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

grant execute on function is_admin() to authenticated;

drop policy "profiles_select_admin" on profiles;
create policy "profiles_select_admin" on profiles
  for select to authenticated
  using (is_admin());

drop policy "folders_select_admin" on folders;
create policy "folders_select_admin" on folders
  for select to authenticated
  using (is_admin());

drop policy "chats_select_admin" on chats;
create policy "chats_select_admin" on chats
  for select to authenticated
  using (is_admin());

drop policy "chat_messages_select_admin" on chat_messages;
create policy "chat_messages_select_admin" on chat_messages
  for select to authenticated
  using (is_admin());

drop policy "drills_select_admin" on drills;
create policy "drills_select_admin" on drills
  for select to authenticated
  using (is_admin());
