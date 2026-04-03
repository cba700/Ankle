alter table public.venues
  add column if not exists default_image_urls text[] not null default '{}'::text[],
  add column if not exists default_rules text[] not null default '{}'::text[],
  add column if not exists default_safety_notes text[] not null default '{}'::text[];

alter table public.matches
  add column if not exists venue_name text not null default '',
  add column if not exists district text not null default '',
  add column if not exists address text not null default '',
  add column if not exists directions text not null default '',
  add column if not exists parking text not null default '',
  add column if not exists smoking text not null default '',
  add column if not exists shower_locker text not null default '';

update public.matches
set
  venue_name = venues.name,
  district = venues.district,
  address = venues.address,
  directions = venues.directions,
  parking = venues.parking,
  smoking = venues.smoking,
  shower_locker = venues.shower_locker
from public.venues
where venues.id = public.matches.venue_id
  and (
    public.matches.venue_name = ''
    or public.matches.district = ''
    or public.matches.address = ''
    or public.matches.directions = ''
    or public.matches.parking = ''
    or public.matches.smoking = ''
    or public.matches.shower_locker = ''
  );

with venue_defaults as (
  select distinct on (venue_id)
    venue_id,
    image_urls,
    rules,
    safety_notes
  from public.matches
  order by venue_id, start_at desc, created_at desc
)
update public.venues
set
  default_image_urls = case
    when coalesce(array_length(public.venues.default_image_urls, 1), 0) = 0
      then coalesce(venue_defaults.image_urls, '{}'::text[])
    else public.venues.default_image_urls
  end,
  default_rules = case
    when coalesce(array_length(public.venues.default_rules, 1), 0) = 0
      then coalesce(venue_defaults.rules, '{}'::text[])
    else public.venues.default_rules
  end,
  default_safety_notes = case
    when coalesce(array_length(public.venues.default_safety_notes, 1), 0) = 0
      then coalesce(venue_defaults.safety_notes, '{}'::text[])
    else public.venues.default_safety_notes
  end
from venue_defaults
where venue_defaults.venue_id = public.venues.id;
