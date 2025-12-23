-- Create staff_members table
create table if not exists public.staff_members (
    id uuid default gen_random_uuid() primary key,
    name text not NULL,
    email text,
    phone text,
    role text default 'staff',
    personal_details text, -- JSON or text blob for simple flexibility
    joining_date date,
    leaving_date date,
    created_at timestamptz default now()
);

-- Create staff_attendance table
create table if not exists public.staff_attendance (
    id uuid default gen_random_uuid() primary key,
    staff_id uuid references public.staff_members(id) on delete cascade,
    check_in_time timestamptz,
    check_out_time timestamptz,
    date date default CURRENT_DATE,
    created_at timestamptz default now()
);

-- Enable RLS
alter table public.staff_members enable row level security;
alter table public.staff_attendance enable row level security;

-- Policies (Adjust strictly for production)
create policy "Authenticated users can view staff" on public.staff_members
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage staff" on public.staff_members
  for all using (auth.role() = 'authenticated'); -- Simplified for demo

create policy "Authenticated users can view attendance" on public.staff_attendance
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage attendance" on public.staff_attendance
  for all using (auth.role() = 'authenticated'); -- Simplified for demo
