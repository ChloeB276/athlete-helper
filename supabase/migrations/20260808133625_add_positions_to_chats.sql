-- A chat was scoped to a single `position` text column, but a player can
-- play multiple positions (profiles.positions is already text[]). Move
-- chats to the same shape so a chat reflects every position the player
-- selected instead of silently collapsing to just one.

alter table chats add column if not exists positions text[] not null default '{}';

update chats set positions = array[position]
where position is not null and positions = '{}';

alter table chats drop column if exists position;
