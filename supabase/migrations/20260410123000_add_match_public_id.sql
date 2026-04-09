alter table public.matches
add column if not exists public_id text;

create or replace function public.generate_match_public_id()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_candidate text;
begin
  loop
    v_candidate := substring(
      md5(
        gen_random_uuid()::text ||
        clock_timestamp()::text ||
        random()::text
      )
      from 1 for 10
    );

    exit when not exists (
      select 1
      from public.matches
      where public_id = v_candidate
    );
  end loop;

  return v_candidate;
end;
$$;

update public.matches
set public_id = public.generate_match_public_id()
where public_id is null
   or public_id = '';

alter table public.matches
alter column public_id set default public.generate_match_public_id();

alter table public.matches
alter column public_id set not null;

create unique index if not exists matches_public_id_key
on public.matches (public_id);
