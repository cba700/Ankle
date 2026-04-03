import { formatMoney } from "@/lib/date";
import type {
  AdminMatchFormValue,
  AdminMatchRecord,
  AdminMatchRow,
  AdminMatchStatus,
  AdminOverviewCard,
  AdminVenueFormValue,
  AdminVenueOption,
  AdminVenueRecord,
  AdminVenueRow,
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

export function buildAdminVenueRows(venues: AdminVenueRecord[]): AdminVenueRow[] {
  return venues.map((venue) => ({
    id: venue.id,
    name: venue.name,
    district: venue.district,
    address: venue.address,
    statusLabel: venue.isActive ? "운영 중" : "보관",
    matchCountLabel: `${venue.matchCount}개 매치 연결`,
    editHref: `/admin/venues/${venue.id}/edit`,
    createMatchHref: `/admin/matches/new?venueId=${venue.id}`,
  }));
}

export function buildAdminVenueFormValue(venue?: AdminVenueRecord): AdminVenueFormValue {
  if (!venue) {
    return {
      name: "",
      district: "",
      address: "",
      directions: "",
      parking: "",
      smoking: "",
      showerLocker: "",
      defaultImageUrlsText: "",
      defaultRulesText: "",
      defaultSafetyNotesText: "",
      isActive: true,
    };
  }

  return {
    name: venue.name,
    district: venue.district,
    address: venue.address,
    directions: venue.venueInfo.directions,
    parking: venue.venueInfo.parking,
    smoking: venue.venueInfo.smoking,
    showerLocker: venue.venueInfo.showerLocker,
    defaultImageUrlsText: venue.defaultImageUrls.join("\n"),
    defaultRulesText: venue.defaultRules.join("\n"),
    defaultSafetyNotesText: venue.defaultSafetyNotes.join("\n"),
    isActive: venue.isActive,
  };
}

export function buildAdminMatchFormValue(match?: AdminMatchRecord): AdminMatchFormValue {
  if (!match) {
    return {
      venueEntryMode: "manual",
      selectedVenueId: "",
      title: "",
      venueName: "",
      district: "",
      address: "",
      date: "",
      startTime: "",
      endTime: "",
      status: "",
      format: "",
      capacity: "",
      participantSummary: "신청 0명 · 저장 후 자동 집계",
      price: "",
      genderCondition: "",
      levelCondition: "",
      levelRange: "",
      preparation: "",
      summary: "",
      publicNotice: "",
      operatorNote: "",
      directions: "",
      parking: "",
      smoking: "",
      showerLocker: "",
      imageUrlsText: "",
      tagsText: "",
      rulesText: "",
      safetyNotesText: "",
    };
  }

  return {
    venueEntryMode: match.venueId ? "managed" : "manual",
    selectedVenueId: match.venueId,
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
    imageUrlsText: match.imageUrls.join("\n"),
    tagsText: match.tags.join(", "),
    rulesText: match.rules.join("\n"),
    safetyNotesText: match.safetyNotes.join("\n"),
  };
}

export function applyVenueOptionToMatchFormValue(
  values: AdminMatchFormValue,
  venue: AdminVenueOption,
): AdminMatchFormValue {
  return {
    ...values,
    venueEntryMode: "managed",
    selectedVenueId: venue.id,
    venueName: venue.name,
    district: venue.district,
    address: venue.address,
    directions: venue.venueInfo.directions,
    parking: venue.venueInfo.parking,
    smoking: venue.venueInfo.smoking,
    showerLocker: venue.venueInfo.showerLocker,
    imageUrlsText: venue.defaultImageUrls.join("\n"),
    rulesText: venue.defaultRules.join("\n"),
    safetyNotesText: venue.defaultSafetyNotes.join("\n"),
  };
}

function getOccupancyRate(match: AdminMatchRecord) {
  if (match.capacity === 0) {
    return 0;
  }

  return match.currentParticipants / match.capacity;
}
