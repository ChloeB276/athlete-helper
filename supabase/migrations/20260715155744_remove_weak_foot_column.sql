-- Onboarding no longer asks for a weak foot, only a strong foot.
alter table profiles drop column if exists weak_foot;
