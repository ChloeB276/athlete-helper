-- Persist the training-context step (solo/group size + available equipment)
-- that a Drills chat collects once, right after the position, and before it
-- starts generating real-video-grounded drill breakdowns.

alter table chats
  add column if not exists training_partners integer,
  add column if not exists training_equipment text[];
