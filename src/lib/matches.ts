import { addDays, formatDateLabel, formatMoney, getCalendarDates, getSeoulTodayStart, toDateKey } from "@/lib/date";

export type MatchFormat = "3vs3" | "5vs5";
export type MatchStatusKind = "open" | "confirmedSoon" | "closingSoon" | "closed";

export type MatchStatus = {
  kind: MatchStatusKind;
  label: string;
};

export type DistributionEntry = {
  label: string;
  value: number;
  tone: "basic" | "middle" | "high";
};

export type MatchRecord = {
  id: string;
  slug: string;
  dateKey: string;
  dateLabel: string;
  dateTitle: string;
  time: string;
  venueName: string;
  district: string;
  address: string;
  title: string;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  format: MatchFormat;
  durationText: string;
  capacity: number;
  currentParticipants: number;
  preparation: string;
  price: number;
  status: MatchStatus;
  imageUrls: string[];
  venueInfo: {
    directions: string;
    parking: string;
    smoking: string;
    showerLocker: string;
  };
  rules: string[];
  safetyNotes: string[];
  levelDistribution: DistributionEntry[];
  averageLevel: string;
};

type MatchTemplate = {
  id: string;
  venueSlug: string;
  dayOffset: number;
  time: string;
  venueName: string;
  district: string;
  address: string;
  title: string;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  format: MatchFormat;
  durationText: string;
  capacity: number;
  currentParticipants: number;
  preparation: string;
  price: number;
  imageUrls: string[];
  venueInfo: MatchRecord["venueInfo"];
  rules: string[];
  safetyNotes: string[];
  levelDistribution: DistributionEntry[];
  averageLevel: string;
};

export const REFUND_POLICY = [
  { point: "매치 시작 24시간 전", detail: "전액 환불" },
  { point: "매치 시작 12시간 전", detail: "50% 환불" },
  { point: "매치 시작 6시간 이내", detail: "환불 불가" },
  { point: "천재지변 또는 운영 취소", detail: "전액 환불" },
];

const MATCH_TEMPLATES: MatchTemplate[] = [
  {
    id: "match-01",
    venueSlug: "jamsil-riverside",
    dayOffset: 0,
    time: "19:30",
    venueName: "잠실 한강공원 농구장",
    district: "송파",
    address: "서울 송파구 한가람로 65 잠실 한강공원 농구장",
    title: "잠실 선셋 밸런스 3vs3",
    genderCondition: "남녀 모두",
    levelCondition: "모든 레벨",
    levelRange: "초급 ~ 중급",
    format: "3vs3",
    durationText: "2시간",
    capacity: 9,
    currentParticipants: 5,
    preparation: "실내용 운동화 또는 농구화",
    price: 5900,
    imageUrls: ["/court-a.svg", "/court-b.svg", "/court-c.svg", "/court-d.svg"],
    venueInfo: {
      directions: "잠실나들목 도보 7분, 한강공원 자전거길과 바로 연결됩니다.",
      parking: "잠실 한강공원 주차장 이용 가능, 주말 저녁 혼잡도가 높은 편입니다.",
      smoking: "구장 인근 금연 구역, 지정 흡연 구역은 주차장 방향에 있습니다.",
      showerLocker: "샤워실은 없고 간단한 탈의 공간과 물품 보관함이 있습니다.",
    },
    rules: [
      "한 경기 10분, 대기 없이 2시간 동안 로테이션으로 진행합니다.",
      "참가 인원에 따라 밸런스 조정 후 팀을 운영자가 현장에서 배정합니다.",
      "지각자는 바로 다음 경기부터 참여하며, 매치 시작 전 출석 확인이 필요합니다.",
    ],
    safetyNotes: [
      "경기 전 10분 스트레칭을 권장하며 무릎 보호대 착용을 추천합니다.",
      "강한 몸싸움, 무리한 리바운드 경합은 운영자가 즉시 제지합니다.",
      "우천 시 운영 판단에 따라 시간 조정 또는 취소될 수 있습니다.",
    ],
    levelDistribution: [
      { label: "Basic", value: 30, tone: "basic" },
      { label: "Middle", value: 50, tone: "middle" },
      { label: "High", value: 20, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Middle 2 정도입니다.",
  },
  {
    id: "match-02",
    venueSlug: "ttukseom-riverside",
    dayOffset: 0,
    time: "21:00",
    venueName: "뚝섬 한강공원 농구장",
    district: "광진",
    address: "서울 광진구 강변북로 139 뚝섬 한강공원 농구장",
    title: "뚝섬 나이트런 5vs5",
    genderCondition: "남녀 모두",
    levelCondition: "중급 이상 권장",
    levelRange: "중급 ~ 상급",
    format: "5vs5",
    durationText: "2시간",
    capacity: 15,
    currentParticipants: 13,
    preparation: "실내용 운동화 또는 농구화",
    price: 7900,
    imageUrls: ["/court-b.svg", "/court-c.svg", "/court-d.svg", "/court-a.svg"],
    venueInfo: {
      directions: "자양역 2번 출구 도보 10분, 자전거 대여소 바로 맞은편입니다.",
      parking: "뚝섬 한강공원 3주차장 이용 가능, 대중교통 이동을 권장합니다.",
      smoking: "구장 주변은 금연 구역이며 흡연은 강변 산책로 외곽 지정 장소에서 가능합니다.",
      showerLocker: "간이 탈의 부스와 소형 물품 보관함을 사용할 수 있습니다.",
    },
    rules: [
      "매치는 5명 3팀 기준으로 운영하며 2세트 연속 출전은 제한합니다.",
      "실전 감각 유지가 목적이라 공격 14초 룰을 적용할 수 있습니다.",
      "매 경기 종료 후 운영자가 즉시 다음 조합을 공지합니다.",
    ],
    safetyNotes: [
      "손톱과 액세서리는 경기 전 반드시 정리해 주세요.",
      "급격한 방향 전환이 많은 매치로 발목 테이핑을 권장합니다.",
      "컨디션 이상이 있을 경우 운영자에게 먼저 알리고 강도 조절을 요청해 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 10, tone: "basic" },
      { label: "Middle", value: 45, tone: "middle" },
      { label: "High", value: 45, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 High 1 정도입니다.",
  },
  {
    id: "match-03",
    venueSlug: "banpo-riverside",
    dayOffset: 1,
    time: "13:00",
    venueName: "반포 한강공원 세빛 농구장",
    district: "서초",
    address: "서울 서초구 신반포로11길 40 반포 한강공원 세빛 농구장",
    title: "반포 위켄드 스타트 3vs3",
    genderCondition: "남녀 모두",
    levelCondition: "모든 레벨",
    levelRange: "초급 ~ 중급",
    format: "3vs3",
    durationText: "2시간",
    capacity: 9,
    currentParticipants: 9,
    preparation: "농구화 또는 쿠셔닝 좋은 운동화",
    price: 5900,
    imageUrls: ["/court-c.svg", "/court-d.svg", "/court-a.svg", "/court-b.svg"],
    venueInfo: {
      directions: "고속터미널역 8-1번 출구에서 버스 환승 후 도보 5분입니다.",
      parking: "반포 한강공원 주차장 이용 가능, 세빛섬 행사 시 혼잡합니다.",
      smoking: "세빛섬 방향 외곽 지정 구역 외 흡연은 제한됩니다.",
      showerLocker: "락커는 없으며 벤치 옆 짐 보관 존을 운영자가 안내합니다.",
    },
    rules: [
      "초급 참가자 비중이 높아 기본 룰 브리핑 후 매치를 시작합니다.",
      "동점 상황은 자유투 1회 또는 서든포인트 방식으로 정리합니다.",
      "새로 온 참가자도 바로 적응할 수 있게 첫 두 경기는 밸런스 중심으로 운영합니다.",
    ],
    safetyNotes: [
      "점프 착지 공간 확보를 위해 코트 외곽 가방 적재를 제한합니다.",
      "햇빛이 강한 시간대라 수분 보충을 자주 해주세요.",
      "무릎 통증이 있는 경우 인텐스한 수비는 피하고 운영자에게 알려 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 45, tone: "basic" },
      { label: "Middle", value: 40, tone: "middle" },
      { label: "High", value: 15, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Basic 4 ~ Middle 1 사이입니다.",
  },
  {
    id: "match-04",
    venueSlug: "mangwon-riverside",
    dayOffset: 2,
    time: "18:30",
    venueName: "망원 한강공원 농구장",
    district: "마포",
    address: "서울 마포구 마포나루길 467 망원 한강공원 농구장",
    title: "망원 애프터워크 3vs3",
    genderCondition: "남녀 모두",
    levelCondition: "초급 환영",
    levelRange: "초급 ~ 중급",
    format: "3vs3",
    durationText: "2시간",
    capacity: 9,
    currentParticipants: 3,
    preparation: "운동화 또는 농구화",
    price: 4900,
    imageUrls: ["/court-d.svg", "/court-a.svg", "/court-b.svg", "/court-c.svg"],
    venueInfo: {
      directions: "망원역에서 버스 10분, 성산대교 남단 자전거길 진입로 인근입니다.",
      parking: "망원 한강공원 주차장 가능, 평일 저녁은 비교적 수월합니다.",
      smoking: "매치 구역 주변은 금연, 흡연 구역은 주차장 방면에 있습니다.",
      showerLocker: "야외 코트 특성상 샤워실은 없고 간단한 거치형 짐 보관대를 제공합니다.",
    },
    rules: [
      "첫 참가자가 많은 날은 슈팅 감각 체크 시간을 10분 정도 운영합니다.",
      "빠른 신청보다 분위기와 몰입도를 우선으로 맞춥니다.",
      "참가자 레벨 편차가 큰 경우 운영자가 즉시 팀 재조정을 합니다.",
    ],
    safetyNotes: [
      "야외 코트 노면이 미끄러울 수 있어 바닥 확인 후 플레이해 주세요.",
      "주변 산책 동선이 가까워 코트 밖 돌진 플레이를 제한합니다.",
      "통증이 있는 경우 바로 플레이를 멈추고 운영자에게 알려 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 55, tone: "basic" },
      { label: "Middle", value: 35, tone: "middle" },
      { label: "High", value: 10, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Basic 3 정도입니다.",
  },
  {
    id: "match-05",
    venueSlug: "yeouido-riverside",
    dayOffset: 4,
    time: "20:00",
    venueName: "여의도 한강공원 농구장",
    district: "영등포",
    address: "서울 영등포구 여의동로 330 여의도 한강공원 농구장",
    title: "여의도 프라임 5vs5",
    genderCondition: "남녀 모두",
    levelCondition: "중급 이상",
    levelRange: "중급 ~ 상급",
    format: "5vs5",
    durationText: "2시간",
    capacity: 15,
    currentParticipants: 8,
    preparation: "농구화 권장",
    price: 7900,
    imageUrls: ["/court-a.svg", "/court-c.svg", "/court-d.svg", "/court-b.svg"],
    venueInfo: {
      directions: "국회의사당역에서 버스 환승 후 도보 6분, 물빛광장 인근입니다.",
      parking: "여의도 한강공원 주차장 이용 가능, 퇴근 시간대 정체가 잦습니다.",
      smoking: "공원 지정 흡연 구역 외 흡연 금지입니다.",
      showerLocker: "간단한 사물함만 제공되며 샤워 시설은 없습니다.",
    },
    rules: [
      "실전 경기 템포를 유지하기 위해 공격 템포를 빠르게 가져갑니다.",
      "풀코트 수비는 체력 차이를 고려해 제한적으로 운영합니다.",
      "매치 후 10분 정리 미팅과 다음 일정 안내가 이어집니다.",
    ],
    safetyNotes: [
      "충돌 위험이 큰 스크린 플레이는 초반에 운영자가 가이드합니다.",
      "매치 중 과호흡이나 어지러움이 있으면 즉시 교체해 주세요.",
      "비가 예보될 경우 시작 2시간 전 운영 공지를 확인해 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 15, tone: "basic" },
      { label: "Middle", value: 50, tone: "middle" },
      { label: "High", value: 35, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Middle 3 정도입니다.",
  },
  {
    id: "match-06",
    venueSlug: "ichon-riverside",
    dayOffset: 6,
    time: "10:30",
    venueName: "이촌 한강공원 농구장",
    district: "용산",
    address: "서울 용산구 이촌로72길 62 이촌 한강공원 농구장",
    title: "이촌 모닝 밸런스 3vs3",
    genderCondition: "남녀 모두",
    levelCondition: "모든 레벨",
    levelRange: "초급 ~ 중급",
    format: "3vs3",
    durationText: "2시간",
    capacity: 9,
    currentParticipants: 4,
    preparation: "운동화 또는 농구화",
    price: 5900,
    imageUrls: ["/court-b.svg", "/court-a.svg", "/court-d.svg", "/court-c.svg"],
    venueInfo: {
      directions: "이촌역에서 도보 12분, 한강예술공원 산책로 바로 옆입니다.",
      parking: "공원 주차장 이용 가능, 오전 시간대는 비교적 여유 있습니다.",
      smoking: "흡연은 지정 구역에서만 가능하며 코트 주변은 금연입니다.",
      showerLocker: "락커는 없고 간이 짐 보관 존이 마련됩니다.",
    },
    rules: [
      "입문자도 참여할 수 있도록 포지션 가이드를 함께 제공합니다.",
      "리바운드 이후 빠른 전개보다 기본 패스 전개를 우선으로 합니다.",
      "운영자가 참가자별 강도를 보고 매치 간 휴식을 배분합니다.",
    ],
    safetyNotes: [
      "오전 이슬로 코트가 미끄러울 수 있어 워밍업 시 발 상태를 확인해 주세요.",
      "햇빛 대비 캡보다는 시야를 방해하지 않는 밴드를 권장합니다.",
      "과격한 파울은 즉시 경고 후 교체될 수 있습니다.",
    ],
    levelDistribution: [
      { label: "Basic", value: 40, tone: "basic" },
      { label: "Middle", value: 45, tone: "middle" },
      { label: "High", value: 15, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Middle 1 정도입니다.",
  },
  {
    id: "match-07",
    venueSlug: "gwangnaru-riverside",
    dayOffset: 9,
    time: "19:00",
    venueName: "광나루 한강공원 농구장",
    district: "강동",
    address: "서울 강동구 천호동 351-1 광나루 한강공원 농구장",
    title: "광나루 스피드 5vs5",
    genderCondition: "남녀 모두",
    levelCondition: "중급 이상 권장",
    levelRange: "중급 ~ 상급",
    format: "5vs5",
    durationText: "2시간",
    capacity: 15,
    currentParticipants: 7,
    preparation: "농구화 권장",
    price: 7900,
    imageUrls: ["/court-c.svg", "/court-b.svg", "/court-a.svg", "/court-d.svg"],
    venueInfo: {
      directions: "광나루역 2번 출구에서 도보 14분, 자전거길과 붙어 있습니다.",
      parking: "주차장 이용 가능, 매치 시작 전 20분 여유 도착을 권장합니다.",
      smoking: "코트 주변 금연, 지정 구역은 강변 산책로 방향입니다.",
      showerLocker: "샤워실은 없고 수건 보관 가능한 간이 랙을 제공합니다.",
    },
    rules: [
      "템포가 빠른 매치라 공격 전개와 전환 수비를 중시합니다.",
      "5명 미만 출석 시 4vs4로 전환해도 금액은 동일합니다.",
      "운영자가 수비 강도와 파울 기준을 경기 전 공지합니다.",
    ],
    safetyNotes: [
      "발목 부상이 잦은 유형의 매치라 보호 장비를 권장합니다.",
      "거친 리치인 파울은 즉시 제지하며 반복 시 퇴장될 수 있습니다.",
      "체력 분배를 위해 개인 음료를 꼭 준비해 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 12, tone: "basic" },
      { label: "Middle", value: 53, tone: "middle" },
      { label: "High", value: 35, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Middle 4 정도입니다.",
  },
  {
    id: "match-08",
    venueSlug: "jamwon-riverside",
    dayOffset: 11,
    time: "18:00",
    venueName: "잠원 한강공원 농구장",
    district: "서초",
    address: "서울 서초구 잠원로 221-124 잠원 한강공원 농구장",
    title: "잠원 라이트게임 3vs3",
    genderCondition: "남녀 모두",
    levelCondition: "초급 환영",
    levelRange: "초급 ~ 중급",
    format: "3vs3",
    durationText: "2시간",
    capacity: 9,
    currentParticipants: 7,
    preparation: "운동화 또는 농구화",
    price: 5900,
    imageUrls: ["/court-d.svg", "/court-c.svg", "/court-b.svg", "/court-a.svg"],
    venueInfo: {
      directions: "신사역에서 버스 이동 후 도보 8분, 자전거 대여소 옆입니다.",
      parking: "잠원 공영주차장 이용 가능, 주말은 일찍 만차됩니다.",
      smoking: "지정 흡연 구역 외 흡연 금지입니다.",
      showerLocker: "샤워실은 없고 벤치형 짐 보관 공간만 제공합니다.",
    },
    rules: [
      "기본 룰 설명 후 바로 3vs3 로테이션을 시작합니다.",
      "선수 간 레벨 차이가 크면 운영자가 미니 핸디캡을 적용할 수 있습니다.",
      "매치 종료 후 다음 입문 매치 추천과 피드백을 제공합니다.",
    ],
    safetyNotes: [
      "해가 지는 시간대라 시야 적응을 위해 첫 경기는 강도를 낮춰 시작합니다.",
      "젖은 바닥이나 모래가 보이면 바로 운영자에게 알려 주세요.",
      "손가락 부상 예방을 위해 불필요한 해킹 동작을 자제해 주세요.",
    ],
    levelDistribution: [
      { label: "Basic", value: 48, tone: "basic" },
      { label: "Middle", value: 37, tone: "middle" },
      { label: "High", value: 15, tone: "high" },
    ],
    averageLevel: "예상 평균 레벨은 Basic 4 정도입니다.",
  },
];

export function getDisplayDates() {
  return getCalendarDates(14);
}

export function getMatches() {
  const today = getSeoulTodayStart();

  return MATCH_TEMPLATES.map((template) => {
    const date = addDays(today, template.dayOffset);
    const dateKey = toDateKey(date);
    const compactDate = dateKey.replaceAll("-", "");

    return {
      ...template,
      slug: `${template.venueSlug}-${compactDate}-${template.time.replace(":", "")}`,
      dateKey,
      dateLabel: formatDateLabel(date),
      dateTitle: `${formatDateLabel(date)} 매치`,
      status: getMatchStatus(template.format, template.currentParticipants, template.capacity),
    };
  }).sort((a, b) => {
    const left = `${a.dateKey} ${a.time}`;
    const right = `${b.dateKey} ${b.time}`;
    return left.localeCompare(right);
  });
}

export function getMatchBySlug(slug: string) {
  return getMatches().find((match) => match.slug === slug);
}

function getMatchStatus(format: MatchFormat, currentParticipants: number, capacity: number): MatchStatus {
  if (currentParticipants >= capacity) {
    return { kind: "closed", label: "마감" };
  }

  if (format === "3vs3") {
    if (currentParticipants >= 6) {
      return { kind: "closingSoon", label: "마감 임박" };
    }

    if (currentParticipants >= 4) {
      return { kind: "confirmedSoon", label: "확정 임박" };
    }
  }

  if (format === "5vs5") {
    if (currentParticipants >= 12) {
      return { kind: "closingSoon", label: "마감 임박" };
    }

    if (currentParticipants >= 7) {
      return { kind: "confirmedSoon", label: "확정 임박" };
    }
  }

  return { kind: "open", label: "모집 중" };
}

export function getParticipantSummary(match: MatchRecord) {
  return `${match.currentParticipants} / ${match.capacity}명 참여`;
}

export function getPriceLabel(amount: number) {
  return `${formatMoney(amount)}원`;
}

