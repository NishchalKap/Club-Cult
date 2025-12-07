-- Function to handle event registration counting safely
-- This prevents race conditions when multiple users register simultaneously
create or replace function public.handle_event_registration()
returns trigger
language plpgsql
security definer
as $$
begin
  if (TG_OP = 'INSERT') then
    -- Increment count safely
    update public.events
    set registered_count = registered_count + 1
    where id = new.event_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    -- Decrement count safely
    update public.events
    set registered_count = registered_count - 1
    where id = old.event_id;
    return old;
  end if;
  return null;
end;
$$;

-- Trigger for new registrations
create trigger on_registration_created
  after insert on public.event_registrations
  for each row
  execute function public.handle_event_registration();

-- Trigger for cancelled registrations
create trigger on_registration_deleted
  after delete on public.event_registrations
  for each row
  execute function public.handle_event_registration();
