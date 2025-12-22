-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  role text default 'viewer' check (role in ('super_admin', 'institute_admin', 'staff', 'viewer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- EVENTS table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  venue text not null,
  category text not null,
  organizer text not null,
  poster_url text,
  is_published boolean default false,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on events
alter table public.events enable row level security;

-- Events Policies

-- Helper to get role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer;

-- VIEW
create policy "Admins and Staff can view all events." on public.events
  for select using (
    auth.uid() is not null and (
      get_user_role() in ('super_admin', 'institute_admin', 'staff')
    )
  );

create policy "Published events are viewable by everyone." on public.events
  for select using (is_published = true);

-- INSERT
create policy "Staff and Admins can insert events." on public.events
  for insert with check (
    get_user_role() in ('super_admin', 'institute_admin', 'staff')
  );

-- UPDATE
create policy "Staff can update own events." on public.events
  for update using (
    get_user_role() = 'staff' and created_by = auth.uid()
  );

create policy "Admins can update all events." on public.events
  for update using (
    get_user_role() in ('super_admin', 'institute_admin')
  );

-- DELETE
create policy "Staff can delete own events." on public.events
  for delete using (
    get_user_role() = 'staff' and created_by = auth.uid()
  );

create policy "Admins can delete all events." on public.events
  for delete using (
    get_user_role() in ('super_admin', 'institute_admin')
  );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'viewer'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
