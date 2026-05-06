alter table public.matches
drop constraint if exists matches_format_check;

alter table public.matches
add constraint matches_format_check
check (format in ('3vs3', '4vs4', '5vs5'));
