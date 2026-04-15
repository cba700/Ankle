create or replace function public.list_admin_match_participants(
  p_match_ids uuid[]
)
returns table (
  application_id uuid,
  applied_at timestamptz,
  match_id uuid,
  user_id uuid,
  display_name text,
  gender text,
  player_level text,
  temporary_level text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  return query
  select
    applications.id as application_id,
    applications.applied_at,
    applications.match_id,
    applications.user_id,
    profiles.display_name,
    profiles.gender::text,
    profiles.player_level,
    profiles.temporary_level
  from public.match_applications as applications
  left join public.profiles as profiles
    on profiles.id = applications.user_id
  where applications.match_id = any(coalesce(p_match_ids, '{}'::uuid[]))
    and applications.status = 'confirmed'
    and applications.user_id is not null
  order by applications.applied_at asc;
end;
$$;

grant execute on function public.list_admin_match_participants(uuid[]) to authenticated;
