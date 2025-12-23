-- Drop the restrictive path
drop policy if exists "Staff and Admins can insert events." on public.events;

-- Allow any authenticated user to insert events
create policy "Authenticated users can insert events" on public.events
  for insert with check (auth.role() = 'authenticated');

-- Optional: Update existing profile to admin if needed (uncomment to use)
-- update public.profiles set role = 'super_admin' where id = auth.uid();
