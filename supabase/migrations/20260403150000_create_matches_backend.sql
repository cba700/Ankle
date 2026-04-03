create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  district text not null,
  address text not null unique,
  directions text not null default '',
  parking text not null default '',
  smoking text not null default '',
  shower_locker text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists set_venues_updated_at on public.venues;

create trigger set_venues_updated_at
before update on public.venues
for each row
execute function public.handle_updated_at();

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete restrict,
  slug text not null unique,
  title text not null,
  summary text not null default '',
  public_notice text not null default '',
  operator_note text not null default '',
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'cancelled')),
  format text not null check (format in ('3vs3', '5vs5')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  price integer not null default 0 check (price >= 0),
  gender_condition text not null default '',
  level_condition text not null default '',
  level_range text not null default '',
  preparation text not null default '',
  tags text[] not null default '{}'::text[],
  image_urls text[] not null default '{}'::text[],
  rules text[] not null default '{}'::text[],
  safety_notes text[] not null default '{}'::text[],
  view_count integer not null default 0 check (view_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_at > start_at)
);

create unique index if not exists matches_venue_id_start_at_key
on public.matches (venue_id, start_at);

drop trigger if exists set_matches_updated_at on public.matches;

create trigger set_matches_updated_at
before update on public.matches
for each row
execute function public.handle_updated_at();

create table if not exists public.match_applications (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled_by_user', 'cancelled_by_admin')),
  cancel_reason text,
  applied_at timestamptz not null default timezone('utc', now()),
  cancelled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists match_applications_active_user_key
on public.match_applications (match_id, user_id)
where status = 'confirmed' and user_id is not null;

create index if not exists match_applications_match_status_idx
on public.match_applications (match_id, status);

create index if not exists match_applications_user_status_idx
on public.match_applications (user_id, status);

drop trigger if exists set_match_applications_updated_at on public.match_applications;

create trigger set_match_applications_updated_at
before update on public.match_applications
for each row
execute function public.handle_updated_at();

create or replace view public.match_application_counts as
select
  match_id,
  count(*)::integer as confirmed_count
from public.match_applications
where status = 'confirmed'
group by match_id;

grant select on public.venues to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.match_application_counts to anon, authenticated;
grant insert, update on public.venues to authenticated;
grant insert, update on public.matches to authenticated;
grant select, update on public.match_applications to authenticated;

alter table public.venues enable row level security;
alter table public.matches enable row level security;
alter table public.match_applications enable row level security;

drop policy if exists "Public can read active venues" on public.venues;
create policy "Public can read active venues"
on public.venues
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage venues" on public.venues;
create policy "Admins can manage venues"
on public.venues
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read visible matches" on public.matches;
create policy "Public can read visible matches"
on public.matches
for select
to anon, authenticated
using (
  status in ('open', 'closed')
  and start_at >= now()
);

drop policy if exists "Admins can manage matches" on public.matches;
create policy "Admins can manage matches"
on public.matches
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own applications" on public.match_applications;
create policy "Users can read own applications"
on public.match_applications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read applications" on public.match_applications;
create policy "Admins can read applications"
on public.match_applications
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update applications" on public.match_applications;
create policy "Admins can update applications"
on public.match_applications
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

  if v_match.status <> 'open' then
    raise exception 'MATCH_NOT_OPEN';
  end if;

  if v_match.start_at <= now() then
    raise exception 'MATCH_STARTED';
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

create or replace function public.cancel_match_application(p_match_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_match public.matches%rowtype;
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

  if v_match.start_at <= now() then
    raise exception 'MATCH_STARTED';
  end if;

  with target as (
    select id
    from public.match_applications
    where match_id = p_match_id
      and user_id = v_user_id
      and status = 'confirmed'
    order by applied_at desc
    limit 1
    for update
  )
  update public.match_applications
  set
    status = 'cancelled_by_user',
    cancel_reason = 'user_cancelled',
    cancelled_at = timezone('utc', now())
  where id in (select id from target)
  returning id into v_application_id;

  if v_application_id is null then
    raise exception 'APPLICATION_NOT_FOUND';
  end if;

  return v_application_id;
end;
$$;

grant execute on function public.apply_to_match(uuid) to authenticated;
grant execute on function public.cancel_match_application(uuid) to authenticated;

with venue_seed (slug, name, district, address, directions, parking, smoking, shower_locker) as (
  values
    (
      'jamsil-riverside',
      '잠실 한강공원 농구장',
      '송파',
      '서울 송파구 한가람로 65 잠실 한강공원 농구장',
      '잠실나들목 도보 7분, 자전거길과 바로 연결',
      '잠실 한강공원 주차장 이용 가능, 저녁 혼잡도 높음',
      '구장 인근 금연, 흡연은 주차장 방향 지정 구역만 가능',
      '샤워실 없음, 간단한 탈의 공간과 물품 보관함 제공'
    ),
    (
      'ttukseom-riverside',
      '뚝섬 한강공원 농구장',
      '광진',
      '서울 광진구 강변북로 139 뚝섬 한강공원 농구장',
      '자양역 2번 출구 도보 10분',
      '뚝섬 한강공원 3주차장 이용 가능',
      '구장 주변 금연, 외곽 지정 장소만 허용',
      '간이 탈의 부스와 소형 보관함 사용 가능'
    ),
    (
      'banpo-riverside',
      '반포 한강공원 세빛 농구장',
      '서초',
      '서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장',
      '고속터미널역 환승 후 도보 5분',
      '반포 한강공원 주차장 이용 가능, 행사 시 혼잡',
      '세빛섬 방향 외곽 지정 구역만 허용',
      '락커 없음, 벤치 옆 짐 보관 존 운영'
    ),
    (
      'mangwon-riverside',
      '망원 한강공원 농구장',
      '마포',
      '서울 마포구 마포나루길 467 망원 한강공원 농구장',
      '망원역 버스 10분, 성산대교 남단 인근',
      '평일 저녁 비교적 수월',
      '매치 구역 주변 금연',
      '샤워실 없음, 간단한 거치형 보관대 제공'
    ),
    (
      'yeouido-riverside',
      '여의도 한강공원 농구장',
      '영등포',
      '서울 영등포구 여의동로 330 여의도 한강공원 농구장',
      '국회의사당역 환승 후 도보 6분',
      '퇴근 시간대 정체 잦음',
      '공원 지정 흡연 구역 외 금지',
      '간단한 사물함만 제공, 샤워 시설 없음'
    ),
    (
      'ichon-riverside',
      '이촌 한강공원 농구장',
      '용산',
      '서울 용산구 이촌로72길 62 이촌 한강공원 농구장',
      '이촌역 도보 12분, 한강예술공원 산책로 옆',
      '오전 시간대는 비교적 여유',
      '지정 구역에서만 가능',
      '락커 없음, 간이 짐 보관 존 마련'
    )
)
insert into public.venues (
  slug,
  name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker
)
select
  slug,
  name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker
from venue_seed
on conflict (address) do update
set
  slug = excluded.slug,
  name = excluded.name,
  district = excluded.district,
  directions = excluded.directions,
  parking = excluded.parking,
  smoking = excluded.smoking,
  shower_locker = excluded.shower_locker,
  is_active = true;

with match_seed (
  venue_address,
  day_offset,
  start_time,
  end_time,
  title,
  summary,
  public_notice,
  operator_note,
  status,
  format,
  capacity,
  price,
  gender_condition,
  level_condition,
  level_range,
  preparation,
  tags,
  image_urls,
  rules,
  safety_notes
) as (
  values
    (
      '서울 송파구 한가람로 65 잠실 한강공원 농구장',
      0,
      '19:30',
      '21:30',
      '잠실 선셋 밸런스 3vs3',
      '퇴근 후 바로 합류할 수 있는 3vs3 저녁 매치입니다.',
      '첫 참가자도 빠르게 적응할 수 있게 첫 두 게임은 밸런스 위주로 시작합니다.',
      '비 예보가 있어 17시 최종 오픈 여부 재확인 필요',
      'open',
      '3vs3',
      9,
      5900,
      '남녀 모두',
      '모든 레벨',
      '초급 ~ 중급',
      '실내용 운동화 또는 농구화',
      array['입문 환영', '한강 코트', '야간 운영'],
      array['/court-a.svg', '/court-b.svg'],
      array[
        '한 경기 10분 기준으로 2시간 로테이션 운영',
        '현장 밸런스를 보고 운영자가 팀을 조정',
        '지각자는 다음 경기부터 참여'
      ],
      array[
        '워밍업 10분 권장',
        '과도한 몸싸움은 즉시 제지',
        '우천 시 운영 공지 우선'
      ]
    ),
    (
      '서울 광진구 강변북로 139 뚝섬 한강공원 농구장',
      1,
      '21:00',
      '23:00',
      '뚝섬 나이트런 5vs5',
      '야간 조명 환경이 좋은 코트에서 진행하는 5vs5 실전형 매치입니다.',
      '풀코트 강도는 당일 출석 인원에 따라 조정될 수 있습니다.',
      '모객 카피와 메인 이미지 확정 전이라 임시저장 상태 유지',
      'draft',
      '5vs5',
      15,
      7900,
      '남녀 모두',
      '중급 이상 권장',
      '중급 ~ 상급',
      '농구화 권장',
      array['5vs5', '실전 템포', '콘텐츠 대기'],
      array['/court-b.svg', '/court-c.svg'],
      array[
        '5명 3팀 기준 운영, 2세트 연속 출전 제한',
        '공격 14초 룰 선택 적용 가능',
        '경기 종료 후 운영자가 다음 조합 공지'
      ],
      array[
        '손톱과 액세서리 사전 정리',
        '발목 테이핑 권장',
        '컨디션 이상 시 강도 조절 요청'
      ]
    ),
    (
      '서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장',
      2,
      '13:00',
      '15:00',
      '반포 위켄드 스타트 3vs3',
      '주말 낮 시간대 입문자와 재방문자가 균형 있게 섞이는 라이트 매치입니다.',
      '처음 오는 분도 바로 적응할 수 있게 기본 룰 브리핑을 먼저 진행합니다.',
      '잔여 1자리, 스토리용 마감 임박 공지 준비',
      'open',
      '3vs3',
      9,
      5900,
      '남녀 모두',
      '모든 레벨',
      '초급 ~ 중급',
      '쿠셔닝 좋은 운동화 또는 농구화',
      array['주말 피크', '입문 환영', '마감 임박'],
      array['/court-c.svg', '/court-d.svg'],
      array[
        '초급 참가자 비중이 높아 기본 룰 브리핑 후 시작',
        '동점 시 자유투 1회 또는 서든포인트 적용',
        '첫 두 경기는 밸런스 중심 운영'
      ],
      array[
        '코트 외곽 가방 적재 제한',
        '수분 보충 자주 권장',
        '무릎 통증 시 운영자에게 사전 전달'
      ]
    ),
    (
      '서울 마포구 마포나루길 467 망원 한강공원 농구장',
      3,
      '18:30',
      '20:30',
      '망원 애프터워크 3vs3',
      '가벼운 참가비로 퇴근 후 빠르게 참여하는 캐주얼 3vs3 매치입니다.',
      '당일 현장 분위기에 따라 슈팅 체크 시간을 10분 내외로 운영할 수 있습니다.',
      '정원 마감, 취소자 발생 여부만 체크',
      'closed',
      '3vs3',
      9,
      4900,
      '남녀 모두',
      '초급 환영',
      '초급 ~ 중급',
      '운동화 또는 농구화',
      array['가벼운 참가비', '마감', '퇴근 후'],
      array['/court-d.svg', '/court-a.svg'],
      array[
        '첫 참가자가 많으면 슈팅 체크 시간 운영',
        '분위기와 몰입도를 우선해 팀 조정',
        '레벨 편차가 큰 경우 즉시 재조정'
      ],
      array[
        '야외 코트 노면 상태 우선 확인',
        '코트 밖 돌진 플레이 제한',
        '통증이 있으면 바로 플레이 중단'
      ]
    ),
    (
      '서울 영등포구 여의동로 330 여의도 한강공원 농구장',
      4,
      '20:00',
      '22:00',
      '여의도 프라임 5vs5',
      '실전감 있는 평일 야간 5vs5 매치였으나 이번 회차는 운영 취소 처리되었습니다.',
      '기상과 코트 상황 이슈로 이번 회차는 운영 취소되었습니다.',
      '우천 및 코트 컨디션 이슈로 일괄 취소, 문자 공지 완료',
      'cancelled',
      '5vs5',
      15,
      7900,
      '남녀 모두',
      '중급 이상',
      '중급 ~ 상급',
      '농구화 권장',
      array['취소', '우천 대응', '환불 확인'],
      array['/court-a.svg', '/court-c.svg'],
      array[
        '실전 경기 템포 유지',
        '풀코트 수비는 체력 차이를 고려해 제한',
        '매치 후 10분 정리 미팅 예정'
      ],
      array[
        '충돌 위험 큰 스크린 플레이 사전 안내',
        '어지러움 발생 시 즉시 교체',
        '비 예보 시 시작 2시간 전 운영 공지 확인'
      ]
    ),
    (
      '서울 용산구 이촌로72길 62 이촌 한강공원 농구장',
      6,
      '10:30',
      '12:30',
      '이촌 모닝 밸런스 3vs3',
      '오전 시간대 가볍게 뛰고 싶은 유저를 위한 균형형 3vs3 매치입니다.',
      '입문자도 참여할 수 있도록 포지션 가이드를 함께 제공합니다.',
      '오전 타깃 소재 테스트용 회차, 신청 추이 관찰 필요',
      'open',
      '3vs3',
      9,
      5900,
      '남녀 모두',
      '모든 레벨',
      '초급 ~ 중급',
      '운동화 또는 농구화',
      array['오전 매치', '신규 실험', '입문 가이드'],
      array['/court-b.svg', '/court-a.svg'],
      array[
        '입문자 대상 포지션 가이드 동시 제공',
        '기본 패스 전개 우선',
        '참가자 강도에 따라 휴식 배분'
      ],
      array[
        '오전 이슬로 코트 미끄럼 주의',
        '시야를 방해하지 않는 밴드 권장',
        '과격한 파울은 즉시 경고'
      ]
    )
),
base_date as (
  select timezone('Asia/Seoul', now())::date as seoul_today
)
insert into public.matches (
  venue_id,
  slug,
  title,
  summary,
  public_notice,
  operator_note,
  status,
  format,
  start_at,
  end_at,
  capacity,
  price,
  gender_condition,
  level_condition,
  level_range,
  preparation,
  tags,
  image_urls,
  rules,
  safety_notes
)
select
  venues.id,
  venues.slug
    || '-'
    || to_char(base_date.seoul_today + match_seed.day_offset, 'YYYYMMDD')
    || '-'
    || replace(match_seed.start_time, ':', ''),
  match_seed.title,
  match_seed.summary,
  match_seed.public_notice,
  match_seed.operator_note,
  match_seed.status,
  match_seed.format,
  (
    to_char(base_date.seoul_today + match_seed.day_offset, 'YYYY-MM-DD')
    || 'T'
    || match_seed.start_time
    || ':00+09:00'
  )::timestamptz,
  (
    to_char(base_date.seoul_today + match_seed.day_offset, 'YYYY-MM-DD')
    || 'T'
    || match_seed.end_time
    || ':00+09:00'
  )::timestamptz,
  match_seed.capacity,
  match_seed.price,
  match_seed.gender_condition,
  match_seed.level_condition,
  match_seed.level_range,
  match_seed.preparation,
  match_seed.tags,
  match_seed.image_urls,
  match_seed.rules,
  match_seed.safety_notes
from match_seed
cross join base_date
join public.venues venues
  on venues.address = match_seed.venue_address;

with application_seed (title, confirmed_count) as (
  values
    ('잠실 선셋 밸런스 3vs3', 6),
    ('뚝섬 나이트런 5vs5', 0),
    ('반포 위켄드 스타트 3vs3', 8),
    ('망원 애프터워크 3vs3', 9),
    ('여의도 프라임 5vs5', 5),
    ('이촌 모닝 밸런스 3vs3', 4)
)
insert into public.match_applications (
  match_id,
  user_id,
  status,
  applied_at
)
select
  matches.id,
  null,
  'confirmed',
  now() - interval '1 day'
from application_seed
join public.matches matches
  on matches.title = application_seed.title
cross join lateral generate_series(1, application_seed.confirmed_count);
