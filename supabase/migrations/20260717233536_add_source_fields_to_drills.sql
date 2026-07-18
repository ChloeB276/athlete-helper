-- Drills are now grounded in a real YouTube video found via web search, rather
-- than a hardcoded stock image and a constructed search-results-page link.
-- image_url/video_url become nullable since a difficulty tier can come back
-- with no matching video, and source_title records the video's real title.

alter table drills
  add column if not exists source_title text,
  alter column image_url drop not null,
  alter column video_url drop not null;
