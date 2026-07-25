-- Lets a player set their equipment as a standing preference on Home,
-- decoupled from any one chat's training context (which stays per-chat for
-- the Drill Q&A wizard).
alter table profiles add column if not exists equipment text[] not null default '{}';
