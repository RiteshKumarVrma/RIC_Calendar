-- Create Contacts Table
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text,
  email text,
  phone text,
  tags text[] default '{}',
  is_subscribed boolean default true,
  metadata jsonb default '{}'
);

-- Create Message Templates Table
create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  type text not null check (type in ('email', 'whatsapp')),
  subject text, -- Only for email
  content text not null, -- HTML for email, Text with placeholders for WA
  variables text[] default '{}', -- e.g. ['name', 'offer']
  is_active boolean default true
);

-- Create Campaigns Table
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  type text not null check (type in ('email', 'whatsapp')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'processing', 'completed', 'failed', 'paused')),
  template_id uuid references message_templates(id),
  scheduled_at timestamptz,
  filter_tags text[] default '{}', -- If empty, send to all (or logic to be defined in app)
  stats jsonb default '{"total": 0, "sent": 0, "failed": 0, "pending": 0}'
);

-- Create Campaign Messages (Logs & Queue)
create table if not exists campaign_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  campaign_id uuid references campaigns(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  provider_id text, -- ID returned by Resend/Meta
  error_message text,
  retry_count int default 0
);

-- Add indexes for performance
create index if not exists idx_contacts_tags on contacts using gin(tags);
create index if not exists idx_campaign_messages_status on campaign_messages(status);
create index if not exists idx_campaign_messages_campaign_id on campaign_messages(campaign_id);

-- RLS Policies
-- (Assumes you have a way to check for admin, e.g. using a custom claim or a generic "authenticated" role if this is an internal admin tool as requested)
-- For simplicity, using 'authenticated' role for now as requested "Admin-only" implies specific users, but often 'authenticated' + app logic is used.
-- If you have a specific 'admin' role in auth.users or a public.profiles table, adjust accordingly.
-- Based on previous context, this is an Admin tool.

alter table contacts enable row level security;
alter table message_templates enable row level security;
alter table campaigns enable row level security;
alter table campaign_messages enable row level security;

-- Policy: Allow full access to authenticated users (Admins)
create policy "Admins can manage contacts" on contacts
  for all to authenticated using (true) with check (true);

create policy "Admins can manage templates" on message_templates
  for all to authenticated using (true) with check (true);

create policy "Admins can manage campaigns" on campaigns
  for all to authenticated using (true) with check (true);

create policy "Admins can manage campaign messages" on campaign_messages
  for all to authenticated using (true) with check (true);
