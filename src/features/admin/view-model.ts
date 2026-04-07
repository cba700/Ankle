import {
  formatCompactDateLabel,
  formatMoney,
  formatSeoulDateInput,
  formatSeoulDateShortLabel,
  formatSeoulTime,
} from "@/lib/date";
import type {
  CashAccountEntity,
  CashChargeOrderEntity,
  CashTransactionEntity,
} from "@/lib/cash";
import {
  buildAdminVenueLabel,
  formatMatchDurationLabel,
  getMatchDurationMinutes,
  getMatchLevelPreset,
} from "./match-form";
import type {
  AdminBadgeTone,
  AdminCashAccountRow,
  AdminCashChargeOrderRow,
  AdminCashTransactionRow,
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
      tone: "neutral" as const,
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
      label: "모집 중",
      value: `${openMatches.length}개`,
      helper: "지금 열려 있는 매치",
      tone: "accent",
    },
    {
      id: "draft",
      label: "임시 저장",
      value: `${draftMatches.length}개`,
      helper: "공개 전 검토 상태",
      tone: "neutral",
    },
    {
      id: "near-closing",
      label: "마감 임박",
      value: `${nearClosing.length}개`,
      helper: "정원 75% 이상 신청",
      tone: "danger",
    },
    {
      id: "revenue",
      label: "예상 신청 매출",
      value: `${formatMoney(projectedRevenue)}원`,
      helper: "현재 신청 인원 기준",
      tone: "neutral",
    },
  ];
}

export function buildAdminCashOverviewCards({
  accounts,
  chargeOrders,
}: {
  accounts: CashAccountEntity[];
  chargeOrders: CashChargeOrderEntity[];
}): AdminOverviewCard[] {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const pendingOrders = chargeOrders.filter((order) => order.status === "pending").length;
  const failedOrders = chargeOrders.filter((order) => order.status === "failed").length;

  return [
    {
      id: "cash-accounts",
      label: "캐시 계정",
      value: `${accounts.length}명`,
      helper: "잔액이 생성된 사용자",
      tone: "accent",
    },
    {
      id: "cash-balance",
      label: "누적 잔액",
      value: `${formatMoney(totalBalance)}원`,
      helper: "현재 기준 총 캐시 보유액",
      tone: "neutral",
    },
    {
      id: "cash-pending",
      label: "대기 주문",
      value: `${pendingOrders}건`,
      helper: "승인 전 충전 주문",
      tone: "neutral",
    },
    {
      id: "cash-failed",
      label: "실패 주문",
      value: `${failedOrders}건`,
      helper: "후속 확인이 필요한 충전 주문",
      tone: "danger",
    },
  ];
}

export function buildAdminCashAccountRows(
  accounts: CashAccountEntity[],
): AdminCashAccountRow[] {
  return accounts.map((account) => ({
    balanceLabel: `${formatMoney(account.balance)}원`,
    userId: account.userId,
  }));
}

export function buildAdminCashTransactionRows(
  transactions: CashTransactionEntity[],
): AdminCashTransactionRow[] {
  return transactions.map((transaction) => ({
    amountLabel: `${transaction.deltaAmount > 0 ? "+" : "-"}${formatMoney(Math.abs(transaction.deltaAmount))}원`,
    balanceLabel: `잔액 ${formatMoney(transaction.balanceAfter)}원`,
    id: transaction.id,
    metaLabel: `${formatCompactDateLabel(new Date(transaction.createdAt))} · ${compactUserId(transaction.userId)}`,
    title: getCashTransactionTitle(transaction),
    tone: getCashTransactionTone(transaction),
    userId: transaction.userId,
  }));
}

export function buildAdminCashChargeOrderRows(
  chargeOrders: CashChargeOrderEntity[],
): AdminCashChargeOrderRow[] {
  return chargeOrders.map((order) => ({
    amountLabel: `${formatMoney(order.amount)}원`,
    id: order.id,
    metaLabel: `${formatCompactDateLabel(new Date(order.createdAt))} · ${compactUserId(order.userId)}`,
    orderId: order.orderId,
    statusLabel: getChargeOrderStatusLabel(order.status),
    statusTone: getChargeOrderStatusTone(order.status),
    userId: order.userId,
  }));
}

export function buildAdminMatchRows(matches: AdminMatchRecord[]): AdminMatchRow[] {
  return matches.map((match) => {
    const durationMinutes = Number.parseInt(
      getMatchDurationMinutes(match.startAt, match.endAt),
      10,
    );
    const isNearClosing = match.status === "open" && getOccupancyRate(match) >= 0.75;
    const displayStatus = isNearClosing
      ? { label: "마감 임박", tone: "danger" as const }
      : getAdminStatusMeta(match.status);
    const timeLabel = Number.isFinite(durationMinutes)
      ? `${formatSeoulTime(new Date(match.startAt))} 시작 · ${formatMatchDurationLabel(durationMinutes)}`
      : formatSeoulTime(new Date(match.startAt));

    return {
      id: match.id,
      title: match.title,
      venueLabel: buildAdminVenueLabel(match.venueName, match.district),
      dateLabel: formatSeoulDateShortLabel(new Date(match.startAt)),
      timeLabel,
      participantLabel: `${match.currentParticipants} / ${match.capacity}명`,
      occupancyLabel: `잔여 ${Math.max(match.capacity - match.currentParticipants, 0)}석`,
      participantCount: match.currentParticipants,
      capacity: match.capacity,
      priceLabel: `${formatMoney(match.price)}원`,
      levelLabel: [match.levelCondition, match.levelRange].filter(Boolean).join(" · ") || "레벨 미설정",
      description: match.summary || "운영 설명 미입력",
      status: match.status,
      displayStatusLabel: displayStatus.label,
      displayStatusTone: displayStatus.tone,
      isNearClosing,
      tags: match.tags,
      editHref: `/admin/matches/${match.id}/edit`,
    };
  });
}

export function buildAdminVenueRows(venues: AdminVenueRecord[]): AdminVenueRow[] {
  return venues.map((venue) => ({
    id: venue.id,
    name: venue.name,
    district: venue.district,
    address: venue.address,
    statusLabel: venue.isActive ? "운영 중" : "보관",
    statusTone: venue.isActive ? "accent" : "neutral",
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
      durationMinutes: "",
      status: "",
      format: "",
      capacity: "",
      participantSummary: "신청 0명 · 저장 후 자동 집계",
      price: "",
      genderCondition: "",
      level: "",
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
    date: formatSeoulDateInput(new Date(match.startAt)),
    startTime: formatSeoulTime(new Date(match.startAt)),
    durationMinutes: getMatchDurationMinutes(match.startAt, match.endAt),
    status: match.status,
    format: match.format,
    capacity: String(match.capacity),
    participantSummary: `신청 ${match.currentParticipants}명 · 정원 ${match.capacity}명`,
    price: String(match.price),
    genderCondition: match.genderCondition,
    level: getMatchLevelPreset(match.levelCondition, match.levelRange),
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

export function getAdminBadgeMeta({
  status,
  label,
  tone,
}: {
  status?: AdminMatchStatus;
  label?: string;
  tone?: AdminBadgeTone;
}) {
  if (label && tone) {
    return { label, tone };
  }

  if (status) {
    const meta = getAdminStatusMeta(status);

    return {
      label: label ?? meta.label,
      tone: tone ?? meta.tone,
    };
  }

  return {
    label: label ?? "",
    tone: tone ?? "neutral",
  };
}

function getOccupancyRate(match: AdminMatchRecord) {
  if (match.capacity === 0) {
    return 0;
  }

  return match.currentParticipants / match.capacity;
}

function getCashTransactionTitle(transaction: CashTransactionEntity) {
  if (transaction.memo.trim()) {
    return transaction.memo;
  }

  switch (transaction.type) {
    case "charge":
      return "캐시 충전";
    case "match_refund":
      return "매치 환급";
    case "adjustment":
      return "운영 보정";
    case "match_debit":
    default:
      return "매치 신청 차감";
  }
}

function getCashTransactionTone(
  transaction: CashTransactionEntity,
): AdminBadgeTone {
  if (transaction.type === "match_debit" || transaction.deltaAmount < 0) {
    return "danger";
  }

  if (transaction.type === "adjustment") {
    return "neutral";
  }

  return "accent";
}

function getChargeOrderStatusLabel(status: CashChargeOrderEntity["status"]) {
  switch (status) {
    case "paid":
      return "결제 완료";
    case "failed":
      return "결제 실패";
    case "cancelled":
      return "주문 취소";
    case "expired":
      return "주문 만료";
    case "pending":
    default:
      return "결제 대기";
  }
}

function getChargeOrderStatusTone(status: CashChargeOrderEntity["status"]): AdminBadgeTone {
  if (status === "paid") {
    return "accent";
  }

  if (status === "failed" || status === "expired") {
    return "danger";
  }

  return "neutral";
}

function compactUserId(userId: string) {
  return `${userId.slice(0, 8)}...`;
}
