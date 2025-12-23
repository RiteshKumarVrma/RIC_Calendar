-- Add guest_count column to tickets table
alter table public.tickets 
add column if not exists guest_count integer default 0;

-- Optional: ensure check constraint if needed, but simple int is fine for now
