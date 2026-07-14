-- Persist the Drills chat feature (folders, chats, messages, drills) in the
-- database instead of localStorage, scoped to the authenticated owner via RLS.
-- The anon role has no policies on any of these tables, so this data is only
-- ever reachable by an authenticated user, and only their own rows.

create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table folders enable row level security;

create index if not exists folders_user_id_idx on folders (user_id);

create policy "folders_select_authenticated" on folders
  for select to authenticated
  using (auth.uid() = user_id);

create policy "folders_insert_authenticated" on folders
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "folders_update_authenticated" on folders
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "folders_delete_authenticated" on folders
  for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  folder_id uuid references folders (id) on delete set null,
  title text not null default 'New chat',
  position text,
  updated_at timestamptz not null default now()
);

alter table chats enable row level security;

create index if not exists chats_user_id_idx on chats (user_id);
create index if not exists chats_folder_id_idx on chats (folder_id);

create policy "chats_select_authenticated" on chats
  for select to authenticated
  using (auth.uid() = user_id);

create policy "chats_insert_authenticated" on chats
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "chats_update_authenticated" on chats
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chats_delete_authenticated" on chats
  for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  outro text,
  created_at timestamptz not null default now()
);

alter table chat_messages enable row level security;

create index if not exists chat_messages_chat_id_idx on chat_messages (chat_id);

create policy "chat_messages_select_authenticated" on chat_messages
  for select to authenticated
  using (
    exists (
      select 1 from chats
      where chats.id = chat_messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy "chat_messages_insert_authenticated" on chat_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from chats
      where chats.id = chat_messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy "chat_messages_update_authenticated" on chat_messages
  for update to authenticated
  using (
    exists (
      select 1 from chats
      where chats.id = chat_messages.chat_id
        and chats.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chats
      where chats.id = chat_messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create policy "chat_messages_delete_authenticated" on chat_messages
  for delete to authenticated
  using (
    exists (
      select 1 from chats
      where chats.id = chat_messages.chat_id
        and chats.user_id = auth.uid()
    )
  );

create table if not exists drills (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages (id) on delete cascade,
  position_index integer not null default 0,
  difficulty text not null,
  title text not null,
  description text not null,
  image_url text not null,
  video_url text not null,
  kept boolean not null default false
);

alter table drills enable row level security;

create index if not exists drills_message_id_idx on drills (message_id);

create policy "drills_select_authenticated" on drills
  for select to authenticated
  using (
    exists (
      select 1 from chat_messages
      join chats on chats.id = chat_messages.chat_id
      where chat_messages.id = drills.message_id
        and chats.user_id = auth.uid()
    )
  );

create policy "drills_insert_authenticated" on drills
  for insert to authenticated
  with check (
    exists (
      select 1 from chat_messages
      join chats on chats.id = chat_messages.chat_id
      where chat_messages.id = drills.message_id
        and chats.user_id = auth.uid()
    )
  );

create policy "drills_update_authenticated" on drills
  for update to authenticated
  using (
    exists (
      select 1 from chat_messages
      join chats on chats.id = chat_messages.chat_id
      where chat_messages.id = drills.message_id
        and chats.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from chat_messages
      join chats on chats.id = chat_messages.chat_id
      where chat_messages.id = drills.message_id
        and chats.user_id = auth.uid()
    )
  );

create policy "drills_delete_authenticated" on drills
  for delete to authenticated
  using (
    exists (
      select 1 from chat_messages
      join chats on chats.id = chat_messages.chat_id
      where chat_messages.id = drills.message_id
        and chats.user_id = auth.uid()
    )
  );
