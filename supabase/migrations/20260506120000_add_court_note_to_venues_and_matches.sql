alter table public.venues
  add column if not exists court_note text;

alter table public.matches
  add column if not exists court_note text;

alter table public.venues
  alter column directions drop not null,
  alter column parking drop not null,
  alter column smoking drop not null,
  alter column shower_locker drop not null;

alter table public.matches
  alter column directions drop not null,
  alter column parking drop not null,
  alter column smoking drop not null,
  alter column shower_locker drop not null;

with venue_notes as (
  select
    id,
    nullif(
      array_to_string(
        array_remove(
          array[
            case
              when nullif(trim(coalesce(directions, '')), '') is not null
                then '찾아오는 길: ' || trim(directions)
            end,
            case
              when nullif(trim(coalesce(parking, '')), '') is not null
                then '주차: ' || trim(parking)
            end,
            case
              when nullif(trim(coalesce(smoking, '')), '') is not null
                then '흡연: ' || trim(smoking)
            end,
            case
              when nullif(trim(coalesce(shower_locker, '')), '') is not null
                then '보관/샤워: ' || trim(shower_locker)
            end
          ],
          null
        ),
        E'\n'
      ),
      ''
    ) as court_note
  from public.venues
)
update public.venues
set court_note = venue_notes.court_note
from venue_notes
where venue_notes.id = public.venues.id
  and nullif(trim(coalesce(public.venues.court_note, '')), '') is null;

with match_notes as (
  select
    matches.id,
    coalesce(
      nullif(
        array_to_string(
          array_remove(
            array[
              case
                when nullif(trim(coalesce(matches.directions, '')), '') is not null
                  then '찾아오는 길: ' || trim(matches.directions)
              end,
              case
                when nullif(trim(coalesce(matches.parking, '')), '') is not null
                  then '주차: ' || trim(matches.parking)
              end,
              case
                when nullif(trim(coalesce(matches.smoking, '')), '') is not null
                  then '흡연: ' || trim(matches.smoking)
              end,
              case
                when nullif(trim(coalesce(matches.shower_locker, '')), '') is not null
                  then '보관/샤워: ' || trim(matches.shower_locker)
              end
            ],
            null
          ),
          E'\n'
        ),
        ''
      ),
      nullif(trim(coalesce(venues.court_note, '')), '')
    ) as court_note
  from public.matches
  left join public.venues
    on venues.id = matches.venue_id
)
update public.matches
set court_note = match_notes.court_note
from match_notes
where match_notes.id = public.matches.id
  and nullif(trim(coalesce(public.matches.court_note, '')), '') is null;
