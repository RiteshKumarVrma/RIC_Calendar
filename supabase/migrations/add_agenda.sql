-- Add agenda column to events table
alter table public.events add column if not exists agenda jsonb default '[]'::jsonb;
