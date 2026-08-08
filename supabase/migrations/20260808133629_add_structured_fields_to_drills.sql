-- Drills move from one freeform `description` paragraph to a structured
-- breakdown (setup / steps / sets & reps / rest / focus / benefit), plus an
-- `area` tag so a single response covering multiple requested areas can
-- label which area each drill addresses. `description` is kept, now
-- nullable, purely so pre-migration drills still render.

alter table drills
  add column if not exists area text,
  add column if not exists setup text,
  add column if not exists steps text[],
  add column if not exists sets_reps text,
  add column if not exists rest text,
  add column if not exists focus_cue text,
  add column if not exists benefit text,
  alter column description drop not null;
