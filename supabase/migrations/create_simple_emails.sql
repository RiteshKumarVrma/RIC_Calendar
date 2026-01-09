-- Create table for simple email campaigns
create table if not exists simple_emails (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  status text default 'pending', -- 'pending', 'sent', 'failed'
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- RLS Policies (Simple: allow all for authenticated users)
alter table simple_emails enable row level security;

create policy "Enable all for users" on simple_emails
    for all using (true);
