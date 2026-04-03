create or replace function public.close_started_matches()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated_count integer := 0;
begin
  update public.matches
  set status = 'closed'
  where status = 'open'
    and start_at <= now();

  get diagnostics v_updated_count = row_count;

  return v_updated_count;
end;
$$;

grant execute on function public.close_started_matches() to anon, authenticated;

create or replace function public.apply_to_match(p_match_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.matches%rowtype;
  v_confirmed_count integer;
  v_application_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
  into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND';
  end if;

  if v_match.status = 'open' and v_match.start_at <= now() then
    update public.matches
    set status = 'closed'
    where id = p_match_id
      and status = 'open';

    raise exception 'MATCH_STARTED';
  end if;

  if v_match.status <> 'open' then
    raise exception 'MATCH_NOT_OPEN';
  end if;

  if exists (
    select 1
    from public.match_applications
    where match_id = p_match_id
      and user_id = v_user_id
      and status = 'confirmed'
  ) then
    raise exception 'ALREADY_APPLIED';
  end if;

  select count(*)::integer
  into v_confirmed_count
  from public.match_applications
  where match_id = p_match_id
    and status = 'confirmed';

  if v_confirmed_count >= v_match.capacity then
    raise exception 'MATCH_FULL';
  end if;

  insert into public.match_applications (
    match_id,
    user_id,
    status
  )
  values (
    p_match_id,
    v_user_id,
    'confirmed'
  )
  returning id into v_application_id;

  return v_application_id;
exception
  when unique_violation then
    raise exception 'ALREADY_APPLIED';
end;
$$;
