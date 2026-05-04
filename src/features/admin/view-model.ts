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
  CashChargeOrderEventEntity,
  CashRefundRequestEntity,
  CashTransactionEntity,
} from "@/lib/cash";
import { formatPlayerLevel, formatProfileGenderLabel } from "@/lib/player-levels";
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
  AdminCashChargeOrderEventRow,
  AdminCashRefundRequestRow,
  AdminCashTransactionRow,
  AdminCouponTemplateRecord,
  AdminCouponTemplateRow,
  AdminMatchFormValue,
  AdminMatchRecord,
  AdminMatchRefundExceptionMode,
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

export function getAdminMatchRefundExceptionMeta(
  mode: AdminMatchRefundExceptionMode,
) {
  switch (mode) {
    case "participant_shortage_day_before":
      return {
        description: "전날 참가자 미달 안내 후 시작 2시간 전까지 무료 취소를 허용합니다.",
        label: "미달 안내(전날)",
        tone: "danger" as const,
      };
    case "participant_shortage_same_day":
      return {
        description: "당일 참가자 미달 안내 후 시작 2시간 전까지 무료 취소를 허용합니다.",
        label: "미달 안내(당일)",
        tone: "danger" as const,
      };
    case "rain_notice":
      return {
        description: "강수 예보 안내가 발송된 상태입니다. 시작 2시간 전까지 전액 환불을 허용합니다.",
        label: "강수 안내",
        tone: "danger" as const,
      };
    case "rain_change_notice":
      return {
        description: "강수 변동 안내 상태입니다. 현장 확인 후 운영자가 개별 환불을 처리합니다.",
        label: "강수 변동 안내",
        tone: "danger" as const,
      };
    case "none":
    default:
      return {
        description: "현재 별도 예외 환불 안내가 적용되지 않습니다.",
        label: "기본 환불",
        tone: "neutral" as const,
      };
  }
}

export function buildAdminOverviewCards(matches: AdminMatchRecord[]): AdminOverviewCard[] {
  const openMatches = matches.filter(
    (match) => match.status === "open" && !isSoldOutMatch(match),
  );
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
  refundRequests,
}: {
  accounts: CashAccountEntity[];
  chargeOrders: CashChargeOrderEntity[];
  refundRequests: CashRefundRequestEntity[];
}): AdminOverviewCard[] {
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const pendingOrders = chargeOrders.filter((order) => order.status === "pending").length;
  const failedOrders = chargeOrders.filter((order) => order.status === "failed").length;
  const pendingRefundRequests = refundRequests.filter(
    (request) => request.status === "pending",
  ).length;

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
    {
      id: "cash-refund-pending",
      label: "환불 대기",
      value: `${pendingRefundRequests}건`,
      helper: "결제 취소 처리 중인 환불 신청",
      tone: pendingRefundRequests > 0 ? "danger" : "neutral",
    },
  ];
}

export function buildAdminCouponOverviewCards(
  templates: AdminCouponTemplateRecord[],
): AdminOverviewCard[] {
  const activeTemplates = templates.filter((template) => template.isActive);
  const activeTemplate = activeTemplates[0] ?? null;
  const highestDiscountAmount = activeTemplates.reduce(
    (max, template) => Math.max(max, template.discountAmount),
    0,
  );
  const issuedCount = templates.reduce((sum, template) => sum + template.issuedCount, 0);
  const availableCount = templates.reduce((sum, template) => sum + template.availableCount, 0);
  const usedCount = templates.reduce((sum, template) => sum + template.usedCount, 0);
  const activeSummary =
    activeTemplates.length === 0
      ? "없음"
      : activeTemplates.length === 1
        ? activeTemplates[0].name
        : `${activeTemplates.length}개 운영 중`;
  const activeHelper =
    activeTemplates.length === 0
      ? "현재 운영 중인 쿠폰 없음"
      : activeTemplates.length === 1
        ? "신규가입 시 자동 지급 중"
        : `${activeTemplate?.name ?? "쿠폰"} 외 ${activeTemplates.length - 1}개 자동 지급`;

  return [
    {
      id: "coupon-active",
      label: "운영 중인 쿠폰",
      value: activeSummary,
      helper: activeHelper,
      tone: activeTemplates.length > 0 ? "accent" : "neutral",
    },
    {
      id: "coupon-discount",
      label: "최대 할인액",
      value: highestDiscountAmount > 0 ? `${formatMoney(highestDiscountAmount)}원` : "-",
      helper: "운영 중인 쿠폰 기준",
      tone: highestDiscountAmount > 0 ? "accent" : "neutral",
    },
    {
      id: "coupon-issued",
      label: "누적 발급",
      value: `${issuedCount}장`,
      helper: "전체 지급 수",
      tone: "neutral",
    },
    {
      id: "coupon-available",
      label: "사용 가능",
      value: `${availableCount}장`,
      helper: `사용 완료 ${usedCount}장`,
      tone: availableCount > 0 ? "accent" : "neutral",
    },
  ];
}

export function buildAdminCouponTemplateRows(
  templates: AdminCouponTemplateRecord[],
): AdminCouponTemplateRow[] {
  return templates.map((template) => ({
    availableCountLabel: `${template.availableCount}장`,
    discountAmount: template.discountAmount,
    discountAmountLabel: `${formatMoney(template.discountAmount)}원`,
    id: template.id,
    isActive: template.isActive,
    issuedCountLabel: `${template.issuedCount}장`,
    metaLabel: `신규가입 자동 지급 · ${formatCompactDateLabel(new Date(template.updatedAt))} 수정`,
    name: template.name,
    statusLabel: template.isActive ? "활성" : "비활성",
    statusTone: template.isActive ? "accent" : "neutral",
    usedCountLabel: `${template.usedCount}장`,
  }));
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
    detailLabel:
      order.lastErrorMessage ??
      order.failureMessage ??
      order.cancelReason ??
      (order.approvedAt ? "승인 완료" : "추가 확인 필요 없음"),
    id: order.id,
    metaLabel: `${formatCompactDateLabel(new Date(order.createdAt))} · ${compactUserId(order.userId)}`,
    orderId: order.orderId,
    paymentKeyLabel: order.tossPaymentKey ? compactPaymentKey(order.tossPaymentKey) : "-",
    statusLabel: getChargeOrderStatusLabel(order.status),
    statusTone: getChargeOrderStatusTone(order.status),
    userId: order.userId,
  }));
}

export function buildAdminCashChargeOrderEventRows(
  events: CashChargeOrderEventEntity[],
): AdminCashChargeOrderEventRow[] {
  return events.map((event) => ({
    eventType: event.eventType,
    id: event.id,
    metaLabel: `${formatCompactDateLabel(new Date(event.createdAt))} · ${compactEventId(event.providerEventId)}`,
    orderId: event.orderId,
    processedResultLabel: event.processedResult,
  }));
}

export function buildAdminCashRefundRequestRows(
  requests: CashRefundRequestEntity[],
  paymentMethodLabels = new Map<string, string>(),
): AdminCashRefundRequestRow[] {
  return requests.map((request) => ({
    id: request.id,
    metaLabel: formatCompactDateLabel(new Date(request.createdAt)),
    refundMethodLabel:
      paymentMethodLabels.get(request.id) ??
      (request.bankName ? "계좌 환불" : "충전 시 사용한 결제수단"),
    requestedAmountLabel: `${formatMoney(request.requestedAmount)}원`,
    statusLabel: getRefundRequestStatusLabel(request.status),
    statusTone: getRefundRequestStatusTone(request.status),
    userId: request.userId,
  }));
}

export function buildAdminMatchRows(matches: AdminMatchRecord[]): AdminMatchRow[] {
  return matches.map((match) => {
    const durationMinutes = Number.parseInt(
      getMatchDurationMinutes(match.startAt, match.endAt),
      10,
    );
    const isSoldOut = isSoldOutMatch(match);
    const isNearClosing =
      match.status === "open" && !isSoldOut && getOccupancyRate(match) >= 0.75;
    const displayStatus = isSoldOut
      ? { label: "마감", tone: "neutral" as const }
      : isNearClosing
        ? { label: "마감 임박", tone: "danger" as const }
        : getAdminStatusMeta(match.status);
    const timeLabel = Number.isFinite(durationMinutes)
      ? `${formatSeoulTime(new Date(match.startAt))} 시작 · ${formatMatchDurationLabel(durationMinutes)}`
      : formatSeoulTime(new Date(match.startAt));
    const refundExceptionMeta = getAdminMatchRefundExceptionMeta(
      match.refundExceptionMode,
    );

    return {
      id: match.id,
      startAt: match.startAt,
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
      refundExceptionLabel:
        match.refundExceptionMode === "none" ? null : refundExceptionMeta.label,
      refundExceptionMode: match.refundExceptionMode,
      refundExceptionTone:
        match.refundExceptionMode === "none" ? null : refundExceptionMeta.tone,
      isNearClosing,
      isSoldOut,
      tags: match.tags,
      editHref: `/admin/matches/${match.id}/edit`,
      participantPreviewLabel:
        match.participants.length > 0
          ? `${match.participants[0]?.displayName ?? ""}${match.participants.length > 1 ? ` 외 ${match.participants.length - 1}명` : ""}`
          : "참가자 없음",
      participants: match.participants.map((participant) => ({
        applicationId: participant.applicationId,
        displayName: participant.displayName,
        genderLabel: formatProfileGenderLabel(participant.gender),
        noShowNoticeSent: participant.noShowNoticeSent,
        playerLevelLabel: formatPlayerLevel(participant.playerLevel),
        resolvedPlayerLevel: participant.playerLevel,
        userId: participant.userId,
      })),
      quickSummary: `${match.format} · ${match.genderCondition || "성별 무관"} · ${match.price > 0 ? `${formatMoney(match.price)}원` : "무료"}`,
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
      weatherGridNx: "",
      weatherGridNy: "",
      defaultImageUrls: [],
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
    weatherGridNx: venue.weatherGridNx ? String(venue.weatherGridNx) : "",
    weatherGridNy: venue.weatherGridNy ? String(venue.weatherGridNy) : "",
    defaultImageUrls: venue.defaultImageUrls,
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
      refundExceptionMode: "none",
      format: "",
      capacity: "",
      participantSummary: "신청 0명 · 저장 후 자동 집계",
      price: "",
      genderCondition: "",
      level: "",
      preparation: "",
      weatherGridNx: "",
      weatherGridNy: "",
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
    refundExceptionMode: match.refundExceptionMode,
    format: match.format,
    capacity: String(match.capacity),
    participantSummary: `신청 ${match.currentParticipants}명 · 정원 ${match.capacity}명`,
    price: String(match.price),
    genderCondition: match.genderCondition,
    level: getMatchLevelPreset(match.levelCondition, match.levelRange),
    preparation: match.preparation,
    weatherGridNx: match.weatherGridNx ? String(match.weatherGridNx) : "",
    weatherGridNy: match.weatherGridNy ? String(match.weatherGridNy) : "",
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
    weatherGridNx: venue.weatherGridNx ? String(venue.weatherGridNx) : "",
    weatherGridNy: venue.weatherGridNy ? String(venue.weatherGridNy) : "",
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

function isSoldOutMatch(match: AdminMatchRecord) {
  return match.currentParticipants >= match.capacity;
}

function getCashTransactionTitle(transaction: CashTransactionEntity) {
  if (transaction.memo.trim()) {
    return transaction.memo;
  }

  switch (transaction.type) {
    case "charge":
      return "캐시 충전";
    case "charge_refund":
      return "충전 환불";
    case "refund_hold":
      return "캐시 환불 신청";
    case "refund_release":
      return "환불 미처리 금액 반환";
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
  if (
    transaction.type === "match_debit" ||
    transaction.type === "refund_hold" ||
    transaction.deltaAmount < 0
  ) {
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

function getRefundRequestStatusLabel(status: CashRefundRequestEntity["status"]) {
  switch (status) {
    case "processed":
      return "처리 완료";
    case "rejected":
      return "반려";
    case "cancelled":
      return "취소";
    case "pending":
    default:
      return "처리 대기";
  }
}

function getRefundRequestStatusTone(status: CashRefundRequestEntity["status"]): AdminBadgeTone {
  if (status === "processed") {
    return "accent";
  }

  if (status === "pending") {
    return "danger";
  }

  return "neutral";
}

function compactUserId(userId: string) {
  return `${userId.slice(0, 8)}...`;
}

function compactPaymentKey(paymentKey: string) {
  if (paymentKey.length <= 16) {
    return paymentKey;
  }

  return `${paymentKey.slice(0, 10)}...${paymentKey.slice(-4)}`;
}

function compactEventId(eventId: string) {
  if (eventId.length <= 18) {
    return eventId;
  }

  return `${eventId.slice(0, 12)}...`;
}
