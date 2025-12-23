-- Promote all existing profiles to super_admin
update public.profiles
set role = 'super_admin';

-- Ensure future signups are super_admin (optional, for dev only)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (new.id, new.raw_user_meta_data->>'name', 'super_admin');
  return new;
end;
$$ language plpgsql security definer;
