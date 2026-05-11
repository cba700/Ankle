begin;

with venue_seed (
  id,
  slug,
  name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker,
  is_active,
  default_image_urls,
  default_rules,
  default_safety_notes,
  court_note
) as (
  values
    (
      '01cf3ca0-d72c-4db3-bfee-0483ea3b287b'::uuid,
      '영등포-여의도-한강공원-농구장',
      '여의도 한강공원 농구장',
      '영등포',
      '서울 영등포구 여의동로 330 여의도 한강공원 농구장',
      '국회의사당역 버스 환승 후 도보 6분',
      '공원 주차장 이용 가능, 퇴근 시간대 혼잡할 수 있음',
      '지정 흡연 구역 외 흡연 금지',
      '샤워실 없음, 간이 짐 보관대 제공',
      true,
      '{}'::text[],
      array['10분 로테이션 운영', '팀 밸런스는 운영자가 현장 조정', '지각자는 다음 경기부터 참여'],
      array['워밍업 10분 권장', '과도한 몸싸움은 즉시 제지', '우천 시 운영 공지 우선'],
      E'찾아오는 길: 국회의사당역 버스 환승 후 도보 6분\n주차: 공원 주차장 이용 가능, 퇴근 시간대 혼잡할 수 있음\n흡연: 지정 흡연 구역 외 흡연 금지\n보관/샤워: 샤워실 없음, 간이 짐 보관대 제공'
    ),
    (
      '1bc29e8a-9e50-44cc-9a35-c5d3f15a3949'::uuid,
      'banpo-riverside',
      '반포 한강공원 세빛 농구장',
      '서초',
      '서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장',
      '고속터미널역 환승 후 도보 5분',
      '반포 한강공원 주차장 이용 가능, 행사 시 혼잡',
      '세빛섬 방향 외곽 지정 구역만 허용',
      '락커 없음, 벤치 옆 짐 보관 존 운영',
      true,
      '{}'::text[],
      '{}'::text[],
      '{}'::text[],
      E'찾아오는 길: 고속터미널역 환승 후 도보 5분\n주차: 반포 한강공원 주차장 이용 가능, 행사 시 혼잡\n흡연: 세빛섬 방향 외곽 지정 구역만 허용\n보관/샤워: 락커 없음, 벤치 옆 짐 보관 존 운영'
    ),
    (
      '341e2918-355f-4303-bfc4-19093d7a3df4'::uuid,
      'ichon-riverside',
      '이촌 한강공원 농구장',
      '용산',
      '서울 용산구 이촌로72길 62 이촌 한강공원 농구장',
      '이촌역 도보 12분, 한강예술공원 산책로 옆',
      '오전 시간대는 비교적 여유',
      '지정 구역에서만 가능',
      '락커 없음, 간이 짐 보관 존 마련',
      true,
      '{}'::text[],
      '{}'::text[],
      '{}'::text[],
      E'찾아오는 길: 이촌역 도보 12분, 한강예술공원 산책로 옆\n주차: 오전 시간대는 비교적 여유\n흡연: 지정 구역에서만 가능\n보관/샤워: 락커 없음, 간이 짐 보관 존 마련'
    ),
    (
      '49989b44-f5ed-4699-bd83-8ea54ff707da'::uuid,
      'jamwon-riverside',
      '잠원 한강공원 농구장',
      '서초',
      '서울 서초구 잠원로 221-124 잠원 한강공원 농구장',
      '신사역에서 버스로 이동 후 도보 8분, 자전거 대여소 옆입니다.',
      '잠원 공영주차장 이용 가능, 주말에는 일찍 만차될 수 있습니다.',
      '지정 흡연 구역 외 흡연은 금지됩니다.',
      '샤워실은 없고 벤치형 짐 보관 공간만 제공합니다.',
      true,
      '{}'::text[],
      array[
        '기본 룰 설명 후 3vs3 로테이션으로 빠르게 시작합니다.',
        '레벨 차이가 크면 운영자가 미니 핸디캡을 적용할 수 있습니다.',
        '매치 종료 후 다음 입문 매치 추천과 짧은 피드백을 제공합니다.'
      ],
      array[
        '해가 지는 시간대라 첫 경기에는 속도를 낮춰 시야 적응을 돕습니다.',
        '젖은 바닥이나 모래가 보이면 즉시 운영자에게 알려 주세요.',
        '손가락 부상을 줄이기 위해 무리한 스틸 동작은 자제해 주세요.'
      ],
      E'찾아오는 길: 신사역에서 버스로 이동 후 도보 8분, 자전거 대여소 옆입니다.\n주차: 잠원 공영주차장 이용 가능, 주말에는 일찍 만차될 수 있습니다.\n흡연: 지정 흡연 구역 외 흡연은 금지됩니다.\n보관/샤워: 샤워실은 없고 벤치형 짐 보관 공간만 제공합니다.'
    ),
    (
      '7b877f7d-327c-4891-bf31-e2dd711ec99a'::uuid,
      '강동-광나루-한강공원-농구장-a',
      '광나루 한강공원 농구장 A',
      '강동',
      '서울 강동구 암사동 624-3 광나루한강공원농구장',
      '',
      '',
      '',
      '',
      true,
      array[
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/7b877f7d-327c-4891-bf31-e2dd711ec99a/kakaotalk-20260402-155909505-01-1776761982983-1.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/7b877f7d-327c-4891-bf31-e2dd711ec99a/kakaotalk-20260402-155909505-02-1776761983891-2.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/7b877f7d-327c-4891-bf31-e2dd711ec99a/kakaotalk-20260402-155909505-03-1776761984727-3.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/7b877f7d-327c-4891-bf31-e2dd711ec99a/kakaotalk-20260402-155909505-04-1776761985526-4.webp'
      ],
      array[
        '경기 시간은 10분이에요.',
        '공격제한시간 · 3초룰 · 팀파울 · 5반칙 퇴장 은 적용되지 않아요.',
        '일반 파울은 경기를 멈추고, 사이드 라인 스로인으로 진행해요.',
        '강한 파울은 구두 경고 후 자유투 진행해요.'
      ],
      array[
        '앵클베스킷은 안전을 최우선으로 생각해요. 참여 전 아래 내용을 꼭 확인해 주세요.',
        '건강 상태와 복장, 구장 환경을 경기 전 직접 확인해 주세요.',
        '거친 몸싸움과 충돌 위험이 큰 플레이는 삼가 주세요.',
        '응급 상황 발생 시 주변과 앵클베스킷 매니저에게 즉시 알려 주세요.'
      ],
      E'찾아오는 길: 지하철 8호선 암사역서 도보 12분/\n버스 340번, 3411번, 3318번 삼성광나루아파트 하차 후 도보 10분\n주차: 광나루 한강공원광나루1주차장\n/최초 30분 1,000원\n이후 10분 초과시마다 200원 추가\n흡연: 지정된 흡연구역 이용해 주세요.\n보관/샤워: x'
    ),
    (
      'aabf8273-3ac7-49fb-84ba-459f09a5e2b7'::uuid,
      'mangwon-riverside',
      '망원 한강공원 농구장',
      '마포',
      '서울 마포구 마포나루길 467 망원 한강공원 농구장',
      '망원역 버스 10분, 성산대교 남단 인근',
      '평일 저녁 비교적 수월',
      '매치 구역 주변 금연',
      '샤워실 없음, 간단한 거치형 보관대 제공',
      true,
      '{}'::text[],
      '{}'::text[],
      '{}'::text[],
      E'찾아오는 길: 망원역 버스 10분, 성산대교 남단 인근\n주차: 평일 저녁 비교적 수월\n흡연: 매치 구역 주변 금연\n보관/샤워: 샤워실 없음, 간단한 거치형 보관대 제공'
    ),
    (
      'df725f8c-a5b6-4067-984e-9d115980e264'::uuid,
      '송파-잠실-한강공원-농구장',
      '잠실 한강공원 농구장',
      '송파',
      '서울 송파구 한가람로 65 잠실 한강공원 농구장',
      '잠실나들목 도보 7분, 자전거길과 바로 연결',
      '잠실 한강공원 주차장 이용 가능, 저녁 혼잡도 높음',
      '구장 인근 금연, 흡연은 주차장 방향 지정 구역만 가능',
      '샤워실 없음, 간단한 탈의 공간과 물품 보관함 제공',
      true,
      '{}'::text[],
      '{}'::text[],
      '{}'::text[],
      E'찾아오는 길: 잠실나들목 도보 7분, 자전거길과 바로 연결\n주차: 잠실 한강공원 주차장 이용 가능, 저녁 혼잡도 높음\n흡연: 구장 인근 금연, 흡연은 주차장 방향 지정 구역만 가능\n보관/샤워: 샤워실 없음, 간단한 탈의 공간과 물품 보관함 제공'
    ),
    (
      'f04cd1d6-d454-450f-9f93-135b1bf8d49b'::uuid,
      '광진-뚝섬-한강공원-농구장',
      '뚝섬 한강공원 농구장',
      '광진',
      '서울 광진구 강변북로 139 뚝섬 한강공원 농구장',
      '자양역 2번 출구 도보 10분',
      '뚝섬 한강공원 3주차장 이용 가능',
      '구장 주변 금연, 외곽 지정 장소만 허용',
      '간이 탈의 부스와 소형 보관함 사용 가능',
      true,
      array[
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/f04cd1d6-d454-450f-9f93-135b1bf8d49b/kakaotalk-20260402-165103992-03-1775755792059-1.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/f04cd1d6-d454-450f-9f93-135b1bf8d49b/kakaotalk-20260402-165103992-04-1775755792305-2.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/f04cd1d6-d454-450f-9f93-135b1bf8d49b/kakaotalk-20260402-165103992-05-1775755792520-3.webp',
        'https://noikzgidbrqvxdlirtkk.supabase.co/storage/v1/object/public/media-public/venues/f04cd1d6-d454-450f-9f93-135b1bf8d49b/kakaotalk-20260402-165103992-06-1775755792696-4.webp'
      ],
      '{}'::text[],
      '{}'::text[],
      E'찾아오는 길: 자양역 2번 출구 도보 10분\n주차: 뚝섬 한강공원 3주차장 이용 가능\n흡연: 구장 주변 금연, 외곽 지정 장소만 허용\n보관/샤워: 간이 탈의 부스와 소형 보관함 사용 가능'
    )
)
insert into public.venues (
  id,
  slug,
  name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker,
  is_active,
  default_image_urls,
  default_rules,
  default_safety_notes,
  court_note
)
select
  id,
  slug,
  name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker,
  is_active,
  default_image_urls,
  default_rules,
  default_safety_notes,
  court_note
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
  is_active = excluded.is_active,
  default_image_urls = excluded.default_image_urls,
  default_rules = excluded.default_rules,
  default_safety_notes = excluded.default_safety_notes,
  court_note = excluded.court_note;

delete from public.match_applications
where user_id is null;

delete from public.matches as matches
where matches.operator_note = 'sample:initial-open-match-v1'
  and not exists (
    select 1
    from public.match_applications as applications
    where applications.match_id = matches.id
      and applications.user_id is not null
  );

delete from public.matches as matches
where matches.title in (
    '잠실 선셋 밸런스 3vs3',
    '뚝섬 나이트런 5vs5',
    '반포 위켄드 스타트 3vs3',
    '망원 애프터워크 3vs3',
    '여의도 프라임 5vs5',
    '이촌 모닝 밸런스 3vs3'
  )
  and not exists (
    select 1
    from public.match_applications as applications
    where applications.match_id = matches.id
      and applications.user_id is not null
  );

with ordered_venues as (
  select
    row_number() over (order by array_position(
      array[
        '서울 영등포구 여의동로 330 여의도 한강공원 농구장',
        '서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장',
        '서울 용산구 이촌로72길 62 이촌 한강공원 농구장',
        '서울 서초구 잠원로 221-124 잠원 한강공원 농구장',
        '서울 강동구 암사동 624-3 광나루한강공원농구장',
        '서울 마포구 마포나루길 467 망원 한강공원 농구장',
        '서울 송파구 한가람로 65 잠실 한강공원 농구장',
        '서울 광진구 강변북로 139 뚝섬 한강공원 농구장'
      ],
      venues.address
    )) as venue_index,
    venues.*
  from public.venues as venues
  where venues.address in (
    '서울 영등포구 여의동로 330 여의도 한강공원 농구장',
    '서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장',
    '서울 용산구 이촌로72길 62 이촌 한강공원 농구장',
    '서울 서초구 잠원로 221-124 잠원 한강공원 농구장',
    '서울 강동구 암사동 624-3 광나루한강공원농구장',
    '서울 마포구 마포나루길 467 망원 한강공원 농구장',
    '서울 송파구 한가람로 65 잠실 한강공원 농구장',
    '서울 광진구 강변북로 139 뚝섬 한강공원 농구장'
  )
),
base_date as (
  select timezone('Asia/Seoul', now())::date as seoul_today
),
match_slots as (
  select
    day_offset,
    slot_index,
    (array['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00', '19:30', '20:30', '21:30'])[slot_index] as start_time,
    (array['11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30', '22:30', '23:30'])[slot_index] as end_time,
    (array['3vs3', '4vs4', '5vs5', '3vs3', '4vs4', '5vs5', '3vs3', '4vs4', '5vs5', '3vs3'])[slot_index] as format,
    (array['모닝', '브런치', '런치', '얼리', '애프터눈', '선셋', '프라임', '나이트', '라스트', '클로징'])[slot_index] as time_label
  from generate_series(0, 13) as day_offset
  cross join generate_series(1, 10) as slot_index
),
match_seed as (
  select
    venues.id as venue_id,
    venues.slug as venue_slug,
    venues.name as venue_name,
    venues.district,
    venues.address,
    venues.court_note,
    venues.directions,
    venues.parking,
    venues.smoking,
    venues.shower_locker,
    slots.day_offset,
    slots.slot_index,
    slots.start_time,
    slots.end_time,
    slots.format,
    slots.time_label,
    case slots.format
      when '3vs3' then 9
      when '4vs4' then 12
      else 15
    end as capacity,
    case slots.format
      when '3vs3' then 5900
      when '4vs4' then 6900
      else 7900
    end as price,
    case
      when coalesce(array_length(venues.default_image_urls, 1), 0) > 0
        then venues.default_image_urls
      else array[
        (array['/court-a.svg', '/court-b.svg', '/court-c.svg', '/court-d.svg'])[((slots.slot_index - 1) % 4) + 1],
        (array['/court-a.svg', '/court-b.svg', '/court-c.svg', '/court-d.svg'])[((slots.slot_index) % 4) + 1]
      ]
    end as image_urls,
    case
      when coalesce(array_length(venues.default_rules, 1), 0) > 0
        then venues.default_rules
      else array[
        '10분 로테이션으로 경기 흐름을 빠르게 이어갑니다.',
        '팀 밸런스는 운영자가 현장에서 조정합니다.',
        '지각자는 다음 경기부터 참여합니다.'
      ]
    end as rules,
    case
      when coalesce(array_length(venues.default_safety_notes, 1), 0) > 0
        then venues.default_safety_notes
      else array[
        '워밍업 10분을 권장합니다.',
        '과도한 몸싸움은 즉시 제지합니다.',
        '우천 시 운영 공지를 우선합니다.'
      ]
    end as safety_notes
  from match_slots as slots
  join ordered_venues as venues
    on venues.venue_index = (((slots.day_offset * 2 + slots.slot_index - 1) % 8) + 1)
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
  safety_notes,
  venue_name,
  district,
  address,
  court_note,
  directions,
  parking,
  smoking,
  shower_locker,
  refund_exception_mode
)
select
  seed.venue_id,
  seed.venue_slug
    || '-'
    || to_char(base_date.seoul_today + seed.day_offset, 'YYYYMMDD')
    || '-'
    || replace(seed.start_time, ':', ''),
  seed.venue_name || ' ' || seed.time_label || ' ' || seed.format,
  seed.venue_name || '에서 새로 오픈한 ' || seed.format || ' 매치입니다.',
  '참가 신청이 막 열린 초기 매치입니다. 정원까지 선착순으로 모집합니다.',
  'sample:initial-open-match-v1',
  'open',
  seed.format,
  (
    to_char(base_date.seoul_today + seed.day_offset, 'YYYY-MM-DD')
    || 'T'
    || seed.start_time
    || ':00+09:00'
  )::timestamptz,
  (
    to_char(base_date.seoul_today + seed.day_offset, 'YYYY-MM-DD')
    || 'T'
    || seed.end_time
    || ':00+09:00'
  )::timestamptz,
  seed.capacity,
  seed.price,
  '남녀 모두',
  case
    when seed.slot_index in (3, 8, 9) then '중급 이상 권장'
    else '모든 레벨'
  end,
  case
    when seed.slot_index in (3, 8, 9) then '중급 ~ 상급'
    else '초급 ~ 중급'
  end,
  case
    when seed.format = '5vs5' then '농구화 권장'
    else '운동화 또는 농구화'
  end,
  array[seed.format, seed.time_label, seed.district],
  seed.image_urls,
  seed.rules,
  seed.safety_notes,
  seed.venue_name,
  seed.district,
  seed.address,
  seed.court_note,
  seed.directions,
  seed.parking,
  seed.smoking,
  seed.shower_locker,
  'none'
from match_seed as seed
cross join base_date
on conflict do nothing;

commit;
