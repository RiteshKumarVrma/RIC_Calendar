-- Create tickets table
create table public.tickets (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticket_code text unique not null,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'checked_in')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tickets enable row level security;

-- Policies for Tickets
create policy "Users can view their own tickets." on public.tickets
  for select using (auth.uid() = user_id);

create policy "Admins and Staff can view all tickets." on public.tickets
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin', 'institute_admin', 'staff')
    )
  );

create policy "Admins and Staff can manage tickets." on public.tickets
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('super_admin', 'institute_admin', 'staff')
    )
  );
