-- Add monitoring_status column
do $$ begin
  create type public.country_monitoring_status as enum ('live','coming_soon');
exception when duplicate_object then null; end $$;

alter table public.countries
  add column if not exists monitoring_status public.country_monitoring_status not null default 'coming_soon';

update public.countries set monitoring_status = 'live'
  where code in ('NL','AT','HR','IS','FI','DK');

update public.countries set monitoring_status = 'coming_soon'
  where code in ('FR','DE','IT','ES');

-- Block tracker creation for non-live countries (defence in depth; UI also disables it)
create or replace function public.assert_tracker_country_live()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare _status public.country_monitoring_status;
begin
  select co.monitoring_status into _status
  from public.centres ce
  join public.countries co on co.id = ce.country_id
  where ce.id = NEW.centre_id;
  if _status is null or _status <> 'live' then
    raise exception 'This country is not yet available for tracking';
  end if;
  return NEW;
end $$;

drop trigger if exists trg_assert_tracker_country_live on public.trackers;
create trigger trg_assert_tracker_country_live
  before insert or update on public.trackers
  for each row execute function public.assert_tracker_country_live();