create or replace function public.get_public_match_level_distribution(
  p_match_id uuid
)
returns table (
  label text,
  value integer
)
language sql
security definer
set search_path = public
as $$
  with level_sources as (
    select
      coalesce(
        nullif(split_part(profiles.player_level, ' ', 1), ''),
        nullif(split_part(profiles.temporary_level, ' ', 1), '')
      ) as level_label
    from public.match_applications as applications
    left join public.profiles as profiles
      on profiles.id = applications.user_id
    where applications.match_id = p_match_id
      and applications.status = 'confirmed'
      and applications.user_id is not null
  ),
  aggregated as (
    select
      level_sources.level_label,
      count(*)::integer as value
    from level_sources
    where level_sources.level_label in ('Basic', 'Middle', 'High', 'Star')
    group by level_sources.level_label
  )
  select
    labels.label,
    coalesce(aggregated.value, 0) as value
  from (
    values ('Basic'), ('Middle'), ('High'), ('Star')
  ) as labels(label)
  left join aggregated
    on aggregated.level_label = labels.label;
$$;

grant execute on function public.get_public_match_level_distribution(uuid) to anon;
grant execute on function public.get_public_match_level_distribution(uuid) to authenticated;
