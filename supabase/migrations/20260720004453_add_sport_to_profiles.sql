-- Adds a real (non-hardcoded) sport field to profiles, powering the Home
-- dashboard's "Sport" summary field. The app is soccer-only today, so this
-- defaults to 'Soccer' but is editable in Settings for future multi-sport support.
alter table profiles add column if not exists sport text not null default 'Soccer';
