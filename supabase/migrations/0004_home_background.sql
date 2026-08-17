-- Lets a user pick a background image for their home screen board.
-- Additive — safe to run on a project with existing data.

alter table profiles add column if not exists background_url text;
