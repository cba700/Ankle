import { formatMoney } from "@/lib/date";
import type {
  AdminMatchFormValue,
  AdminMatchRecord,
  AdminMatchRow,
  AdminMatchStatus,
  AdminOverviewCard,
} from "./types";

const dateLabelFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const dateInputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeInputFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function getAdminStatusMeta(status: AdminMatchStatus) {
  if (status === "open") {
    return {
      label: "모집 중",
      tone: "accent" as const,
      description: "공개 페이지에 노출될 운영 상태",
    };
  }

  if (status === "draft") {
    return {
      label: "임시 저장",
      tone: "soft" as const,
      description: "카피나 일정 확정 전 내부 검토 상태",
    };
  }

  if (status === "cancelled") {
    return {
      label: "운영 취소",
      tone: "danger" as const,
      description: "참가자 공지와 후속 처리가 필요한 상태",
    };
  }

  return {
    label: "마감",
    tone: "neutral" as const,
    description: "정원 마감 또는 노출 종료 상태",
  };
}

export function buildAdminOverviewCards(matches: AdminMatchRecord[]): AdminOverviewCard[] {
  const openMatches = matches.filter((match) => match.status === "open");
  const draftMatches = matches.filter((match) => match.status === "draft");
  const nearClosing = openMatches.filter((match) => getOccupancyRate(match) >= 0.75);
  const projectedRevenue = matches
    .filter((match) => match.status !== "cancelled")
    .reduce((total, match) => total + match.currentParticipants * match.price, 0);

  return [
    {
      id: "open",
      label: "현재 모집 중",
      value: `${openMatches.length}개`,
      helper: "지금 바로 노출 중인 운영 매치 수",
      tone: "accent",
    },
    {
      id: "draft",
      label: "임시 저장",
      value: `${draftMatches.length}개`,
      helper: "카피나 일정 확정 대기 상태",
      tone: "soft",
    },
    {
      id: "near-closing",
      label: "마감 임박",
      value: `${nearClosing.length}개`,
      helper: "정원의 75% 이상이 채워진 회차",
      tone: "danger",
    },
    {
      id: "revenue",
      label: "예상 신청 매출",
      value: `${formatMoney(projectedRevenue)}원`,
      helper: "현재 신청 인원 기준 단순 합계",
      tone: "neutral",
    },
  ];
}

export function buildAdminMatchRows(matches: AdminMatchRecord[]): AdminMatchRow[] {
  return matches.map((match) => ({
    id: match.id,
    title: match.title,
    venueLabel: `${match.venueName} · ${match.district}`,
    dateLabel: dateLabelFormatter.format(new Date(match.startAt)),
    timeLabel: `${timeInputFormatter.format(new Date(match.startAt))} - ${timeInputFormatter.format(new Date(match.endAt))}`,
    participantLabel: `${match.currentParticipants} / ${match.capacity}명`,
    occupancyLabel: `잔여 ${Math.max(match.capacity - match.currentParticipants, 0)}석`,
    priceLabel: `${formatMoney(match.price)}원`,
    levelLabel: `${match.levelCondition} · ${match.levelRange}`,
    description: match.summary,
    status: match.status,
    tags: match.tags,
    editHref: `/admin/matches/${match.id}/edit`,
  }));
}

export function buildAdminMatchFormValue(match?: AdminMatchRecord): AdminMatchFormValue {
  if (!match) {
    return {
      title: "여의도 라이트게임 3vs3",
      venueName: "여의도 한강공원 농구장",
      district: "영등포",
      address: "서울 영등포구 여의동로 330 여의도 한강공원 농구장",
      date: "2026-04-10",
      startTime: "19:30",
      endTime: "21:30",
      status: "draft",
      format: "3vs3",
      capacity: "9",
      participantSummary: "신청 0명 · 저장 후 자동 집계",
      price: "5900",
      genderCondition: "남녀 모두",
      levelCondition: "모든 레벨",
      levelRange: "초급 ~ 중급",
      preparation: "운동화 또는 농구화",
      summary: "퇴근 후 부담 없이 합류할 수 있는 3vs3 한강 매치입니다.",
      publicNotice: "첫 참가자도 빠르게 적응할 수 있게 운영자가 밸런스를 먼저 맞춥니다.",
      operatorNote: "신규 카피 테스트용 회차, 이미지와 혜택 문구는 추후 확정",
      directions: "국회의사당역 버스 환승 후 도보 6분",
      parking: "공원 주차장 이용 가능, 퇴근 시간대 혼잡할 수 있음",
      smoking: "지정 흡연 구역 외 흡연 금지",
      showerLocker: "샤워실 없음, 간이 짐 보관대 제공",
      tagsText: "한강 코트, 입문 환영, 퇴근 후",
      rulesText: "10분 로테이션 운영\n팀 밸런스는 운영자가 현장 조정\n지각자는 다음 경기부터 참여",
      safetyNotesText: "워밍업 10분 권장\n과도한 몸싸움은 즉시 제지\n우천 시 운영 공지 우선",
    };
  }

  return {
    title: match.title,
    venueName: match.venueName,
    district: match.district,
    address: match.address,
    date: dateInputFormatter.format(new Date(match.startAt)),
    startTime: timeInputFormatter.format(new Date(match.startAt)),
    endTime: timeInputFormatter.format(new Date(match.endAt)),
    status: match.status,
    format: match.format,
    capacity: String(match.capacity),
    participantSummary: `신청 ${match.currentParticipants}명 · 정원 ${match.capacity}명`,
    price: String(match.price),
    genderCondition: match.genderCondition,
    levelCondition: match.levelCondition,
    levelRange: match.levelRange,
    preparation: match.preparation,
    summary: match.summary,
    publicNotice: match.publicNotice,
    operatorNote: match.operatorNote,
    directions: match.venueInfo.directions,
    parking: match.venueInfo.parking,
    smoking: match.venueInfo.smoking,
    showerLocker: match.venueInfo.showerLocker,
    tagsText: match.tags.join(", "),
    rulesText: match.rules.join("\n"),
    safetyNotesText: match.safetyNotes.join("\n"),
  };
}

function getOccupancyRate(match: AdminMatchRecord) {
  if (match.capacity === 0) {
    return 0;
  }

  return match.currentParticipants / match.capacity;
}
