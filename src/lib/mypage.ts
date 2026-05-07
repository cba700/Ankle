import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  formatCompactDateLabel,
  formatDateLabel,
  formatMoney,
  formatSeoulTime,
  toDateKey,
} from "@/lib/date";
import {
  listCashTransactionsByUserId,
  listCashRefundRequestPaymentMethodLabels,
  getCashAccountByUserId,
  type CashTransactionEntity,
  type CashTransactionType,
} from "@/lib/cash";
import {
  listUserCouponsByUserId,
  type UserCouponEntity,
} from "@/lib/coupons";
import type {
  PreferredTimeSlot,
  PreferredWeekday,
  TemporaryLevel,
} from "@/lib/player-preferences";
import {
  assertCashFoundationSchemaReady,
  assertCouponSchemaReady,
  assertProfileOnboardingSchemaReady,
} from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/auth";
import { listWishlistMatchesByUserId } from "@/lib/wishlist";
import { formatPhoneNumberForDisplay } from "@/lib/phone-number";

type ProfileRow = {
  avatar_url: string | null;
  display_name: string | null;
  phone_number_e164: string | null;
  preferred_time_slots: PreferredTimeSlot[] | null;
  preferred_weekdays: PreferredWeekday[] | null;
  role: UserRole | null;
  temporary_level: TemporaryLevel | null;
};

type MatchRow = {
  public_id: string | null;
  slug: string | null;
  start_at: string | null;
  title: string | null;
  venue_name: string | null;
};

type ApplicationRow = {
  applied_at: string;
  cancel_reason: string | null;
  cancelled_at: string | null;
  charged_amount_snapshot: number;
  coupon_discount_amount: number;
  id: string;
  match: MatchRow | MatchRow[] | null;
  price_snapshot: number;
  refunded_amount: number;
  status: MyPageApplicationStatus;
};

type CouponMatchRow = {
  id: string;
  match: MatchRow | MatchRow[] | null;
};

type CashChargeOrderContextRow = {
  id: string;
  provider_snapshot: Record<string, unknown> | null;
  status: string | null;
};

type CashRefundRequestContextRow = {
  created_at: string;
  id: string;
  processed_at: string | null;
  rejected_at: string | null;
  status: string;
};

type CashTransactionSourceContext = {
  chargeOrdersById: Map<string, CashChargeOrderContextRow>;
  matchApplicationsById: Map<string, CouponMatchRow>;
  refundPaymentMethodLabelsByRequestId: Map<string, string>;
  refundRequestsById: Map<string, CashRefundRequestContextRow>;
};

export type MyPageApplicationStatus =
  | "confirmed"
  | "cancelled_by_user"
  | "cancelled_by_admin";

export type MyPageProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  phoneNumber: string;
  preferredTimeSlots: PreferredTimeSlot[];
  preferredWeekdays: PreferredWeekday[];
  providerLabel: string;
  role: UserRole;
  temporaryLevel: TemporaryLevel | null;
};

export type MyPageApplication = {
  appliedAt: string;
  appliedDateKey: string;
  cashLabel: string;
  href: string | null;
  id: string;
  metaLabel: string;
  publicId: string | null;
  statusLabel: string;
  statusTone: "accent" | "danger" | "muted";
  title: string;
  venueName: string;
};

export type MyPageCashTransaction = {
  amountLabel: string;
  balanceLabel: string;
  id: string;
  metaLabel: string;
  title: string;
  tone: "accent" | "danger" | "muted";
  type: CashTransactionType;
};

export type MyPageCoupon = {
  discountLabel: string;
  id: string;
  metaLabel: string;
  name: string;
  statusLabel: string;
  statusTone: "accent" | "danger" | "muted";
};

export type MyPageData = {
  applications: MyPageApplication[];
  cashBalanceAmount: number;
  cashBalanceLabel: string;
  cashTransactions: MyPageCashTransaction[];
  coupons: MyPageCoupon[];
  couponCount: number;
  profile: MyPageProfile;
  wishlistCount: number;
};

const APPLICATION_SELECT = `
  id,
  status,
  applied_at,
  cancel_reason,
  cancelled_at,
  price_snapshot,
  charged_amount_snapshot,
  coupon_discount_amount,
  refunded_amount,
  match:matches!match_applications_match_id_fkey (
    public_id,
    slug,
    start_at,
    title,
    venue_name
  )
`;

export async function getMyPageData({
  role,
  user,
}: {
  role: UserRole;
  user: User;
}): Promise<MyPageData> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  await assertCashFoundationSchemaReady(supabase);
  await assertCouponSchemaReady(supabase);
  await assertProfileOnboardingSchemaReady(supabase);

  const [
    { data: profile },
    { data: applications, error: applicationError },
    cashAccount,
    cashTransactions,
    userCoupons,
    wishlistMatches,
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, avatar_url, role, temporary_level, preferred_weekdays, preferred_time_slots, phone_number_e164",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("match_applications")
        .select(APPLICATION_SELECT)
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false }),
      getCashAccountByUserId(supabase, user.id),
      listCashTransactionsByUserId(supabase, user.id),
      listUserCouponsByUserId(supabase, user.id),
      listWishlistMatchesByUserId(user.id, supabase),
    ]);

  const typedProfile = profile as ProfileRow | null;

  if (applicationError) {
    throw new Error(`Failed to load mypage applications: ${applicationError.message}`);
  }

  const usedCouponApplicationIds = userCoupons
    .map((coupon) => coupon.usedMatchApplicationId)
    .filter((id): id is string => Boolean(id));
  const couponMatchesByApplicationId = await getCouponMatchesByApplicationId(
    supabase,
    usedCouponApplicationIds,
  );
  const coupons = userCoupons.map((coupon) =>
    mapCoupon(
      coupon,
      couponMatchesByApplicationId.get(coupon.usedMatchApplicationId ?? "") ?? null,
    ),
  );
  const cashTransactionSourceContext = await getCashTransactionSourceContext(
    supabase,
    user.id,
    cashTransactions,
  );

  return {
    applications: ((applications ?? []) as ApplicationRow[]).map(mapApplication),
    cashBalanceAmount: cashAccount?.balance ?? 0,
    cashBalanceLabel: `${formatMoney(cashAccount?.balance ?? 0)}원`,
    cashTransactions: cashTransactions.map((transaction) =>
      mapCashTransaction(transaction, cashTransactionSourceContext),
    ),
    coupons,
    couponCount: userCoupons.filter((coupon) => coupon.status === "available").length,
    profile: {
      avatarUrl: typedProfile?.avatar_url ?? null,
      displayName: getDisplayName(user, typedProfile),
      email: user.email ?? "이메일 정보 없음",
      phoneNumber: formatPhoneNumberForDisplay(typedProfile?.phone_number_e164 ?? null),
      preferredTimeSlots: typedProfile?.preferred_time_slots ?? [],
      preferredWeekdays: typedProfile?.preferred_weekdays ?? [],
      providerLabel: getProviderLabel(user),
      role: typedProfile?.role ?? role,
      temporaryLevel: typedProfile?.temporary_level ?? null,
    },
    wishlistCount: wishlistMatches.length,
  };
}

function mapApplication(application: ApplicationRow): MyPageApplication {
  const match = normalizeMatch(application.match);

  return {
    appliedAt: application.applied_at,
    appliedDateKey: toDateKey(new Date(application.applied_at)),
    cashLabel: getCashLabel(application),
    href: match?.public_id ? `/match/${match.public_id}` : null,
    id: application.id,
    metaLabel: getMetaLabel(match, application.applied_at),
    publicId: match?.public_id ?? null,
    statusLabel: getStatusLabel(application.status),
    statusTone: getStatusTone(application.status),
    title: match?.title?.trim() || "매치 정보 확인 불가",
    venueName: match?.venue_name?.trim() || "장소 정보 확인 불가",
  };
}

function mapCashTransaction(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
): MyPageCashTransaction {
  const amount = Math.abs(transaction.deltaAmount);
  const isPositive = transaction.deltaAmount > 0;
  const title = getCashTransactionTitle(transaction, sourceContext);

  return {
    amountLabel: `${isPositive ? "+" : "-"}${formatMoney(amount)}원`,
    balanceLabel: `잔액 ${formatMoney(transaction.balanceAfter)}원`,
    id: transaction.id,
    metaLabel: getCashTransactionMetaLabel(transaction, sourceContext, title),
    title,
    tone: getCashTransactionTone(transaction.type, transaction.deltaAmount),
    type: transaction.type,
  };
}

function mapCoupon(
  coupon: UserCouponEntity,
  application: CouponMatchRow | null,
): MyPageCoupon {
  return {
    discountLabel: `${formatMoney(coupon.discountAmountSnapshot)}원`,
    id: coupon.id,
    metaLabel: getCouponMetaLabel(coupon, application),
    name: coupon.nameSnapshot,
    statusLabel: getCouponStatusLabel(coupon.status),
    statusTone: getCouponStatusTone(coupon.status),
  };
}

function normalizeMatch(match: ApplicationRow["match"]) {
  if (!match) {
    return null;
  }

  return Array.isArray(match) ? match[0] ?? null : match;
}

function getDisplayName(user: User, profile: ProfileRow | null) {
  const userMetadata = user.user_metadata;

  return (
    profile?.display_name?.trim() ||
    (typeof userMetadata?.name === "string" ? userMetadata.name.trim() : "") ||
    (typeof userMetadata?.full_name === "string"
      ? userMetadata.full_name.trim()
      : "") ||
    user.email ||
    "앵클 사용자"
  );
}

function getProviderLabel(user: User) {
  const provider =
    user.app_metadata?.provider ??
    (Array.isArray(user.app_metadata?.providers)
      ? user.app_metadata.providers[0]
      : null);

  if (typeof provider === "string" && provider.trim()) {
    return provider.toUpperCase();
  }

  return "ACCOUNT";
}

function getMetaLabel(match: MatchRow | null, appliedAt: string) {
  const appliedDateLabel = formatAppliedDate(appliedAt);

  if (!match?.start_at) {
    return `${appliedDateLabel} 신청`;
  }

  return `${formatSchedule(match.start_at)} · ${appliedDateLabel} 신청`;
}

function getCashLabel(application: ApplicationRow) {
  const chargedAmount = application.charged_amount_snapshot;
  const labels = [`캐시 차감 ${formatMoney(chargedAmount)}원`];

  if (application.coupon_discount_amount > 0) {
    labels.unshift(`쿠폰 ${formatMoney(application.coupon_discount_amount)}원 사용`);
  }

  if (application.status !== "confirmed") {
    if (application.refunded_amount > 0) {
      labels.push(`캐시 환급 ${formatMoney(application.refunded_amount)}원`);
    } else if (chargedAmount > 0) {
      labels.push("캐시 환급 없음");
    }

    if (isCouponRestored(application)) {
      labels.push("쿠폰 복구");
    }
  }

  return labels.join(" · ");
}

function formatSchedule(startAt: string) {
  const date = new Date(startAt);

  return `${formatDateLabel(date)} ${formatSeoulTime(date)}`;
}

function formatAppliedDate(appliedAt: string) {
  return formatCompactDateLabel(new Date(appliedAt));
}

function getStatusLabel(status: MyPageApplicationStatus) {
  switch (status) {
    case "cancelled_by_admin":
      return "운영 취소";
    case "cancelled_by_user":
      return "신청 취소";
    case "confirmed":
    default:
      return "신청 완료";
  }
}

function getStatusTone(status: MyPageApplicationStatus) {
  switch (status) {
    case "cancelled_by_admin":
      return "danger";
    case "cancelled_by_user":
      return "muted";
    case "confirmed":
    default:
      return "accent";
  }
}

async function getCouponMatchesByApplicationId(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  applicationIds: string[],
) {
  const matchesByApplicationId = new Map<string, CouponMatchRow | null>();

  if (applicationIds.length === 0) {
    return matchesByApplicationId;
  }

  const { data, error } = await supabase
    .from("match_applications")
    .select(
      `id, match:matches!match_applications_match_id_fkey (
        public_id,
        slug,
        start_at,
        title,
        venue_name
      )`,
    )
    .in("id", applicationIds);

  if (error) {
    throw new Error(`Failed to load coupon matches: ${error.message}`);
  }

  for (const row of (data ?? []) as CouponMatchRow[]) {
    matchesByApplicationId.set(row.id, row);
  }

  return matchesByApplicationId;
}

function getCouponMetaLabel(
  coupon: UserCouponEntity,
  application: CouponMatchRow | null,
) {
  if (coupon.status === "used") {
    const usedDateLabel = formatCompactDateLabel(new Date(coupon.usedAt ?? coupon.updatedAt));
    const match = normalizeMatch(application?.match ?? null);

    if (match?.title?.trim()) {
      return `${usedDateLabel} · ${match.title.trim()}`;
    }

    return `${usedDateLabel} 사용`;
  }

  if (coupon.restoredAt) {
    return `${formatCompactDateLabel(new Date(coupon.restoredAt))} 복구`;
  }

  return `${formatCompactDateLabel(new Date(coupon.issuedAt))} 발급`;
}

function isCouponRestored(application: ApplicationRow) {
  if (application.coupon_discount_amount <= 0) {
    return false;
  }

  if (application.status === "cancelled_by_admin") {
    return true;
  }

  if (application.status !== "cancelled_by_user") {
    return false;
  }

  const match = normalizeMatch(application.match);

  if (!match?.start_at || !application.cancelled_at) {
    return false;
  }

  return new Date(application.cancelled_at).getTime() <= new Date(match.start_at).getTime() - 2 * 60 * 60 * 1000;
}

function getCouponStatusLabel(status: UserCouponEntity["status"]) {
  if (status === "used") {
    return "사용 완료";
  }

  if (status === "expired") {
    return "만료";
  }

  return "사용 가능";
}

function getCouponStatusTone(status: UserCouponEntity["status"]) {
  if (status === "used") {
    return "muted";
  }

  if (status === "expired") {
    return "danger";
  }

  return "accent";
}

async function getCashTransactionSourceContext(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
  transactions: CashTransactionEntity[],
): Promise<CashTransactionSourceContext> {
  const chargeOrderIds = getTransactionSourceIds(transactions, "charge_order");
  const matchApplicationIds = getTransactionSourceIds(transactions, "match_application");
  const refundRequestIds = getTransactionSourceIds(transactions, "refund_request");

  const [
    chargeOrdersById,
    matchApplicationsById,
    refundRequestsById,
    refundPaymentMethodLabelsByRequestId,
  ] = await Promise.all([
    getCashChargeOrderContextById(supabase, userId, chargeOrderIds),
    getCashMatchApplicationContextById(supabase, userId, matchApplicationIds),
    getCashRefundRequestContextById(supabase, userId, refundRequestIds),
    listCashRefundRequestPaymentMethodLabels(supabase, refundRequestIds),
  ]);

  return {
    chargeOrdersById,
    matchApplicationsById,
    refundPaymentMethodLabelsByRequestId,
    refundRequestsById,
  };
}

function getTransactionSourceIds(
  transactions: CashTransactionEntity[],
  sourceType: CashTransactionEntity["sourceType"],
) {
  return Array.from(
    new Set(
      transactions
        .filter((transaction) => transaction.sourceType === sourceType)
        .map((transaction) => transaction.sourceId)
        .filter((sourceId): sourceId is string => Boolean(sourceId)),
    ),
  );
}

async function getCashChargeOrderContextById(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
  ids: string[],
) {
  const contextById = new Map<string, CashChargeOrderContextRow>();

  if (ids.length === 0) {
    return contextById;
  }

  const { data, error } = await supabase
    .from("cash_charge_orders")
    .select("id, provider_snapshot, status")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to load cash charge order context: ${error.message}`);
  }

  for (const row of (data ?? []) as CashChargeOrderContextRow[]) {
    contextById.set(row.id, row);
  }

  return contextById;
}

async function getCashMatchApplicationContextById(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
  ids: string[],
) {
  const contextById = new Map<string, CouponMatchRow>();

  if (ids.length === 0) {
    return contextById;
  }

  const { data, error } = await supabase
    .from("match_applications")
    .select(
      `id, match:matches!match_applications_match_id_fkey (
        public_id,
        slug,
        start_at,
        title,
        venue_name
      )`,
    )
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to load cash match application context: ${error.message}`);
  }

  for (const row of (data ?? []) as CouponMatchRow[]) {
    contextById.set(row.id, row);
  }

  return contextById;
}

async function getCashRefundRequestContextById(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
  ids: string[],
) {
  const contextById = new Map<string, CashRefundRequestContextRow>();

  if (ids.length === 0) {
    return contextById;
  }

  const { data, error } = await supabase
    .from("cash_refund_requests")
    .select("id, status, created_at, processed_at, rejected_at")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to load cash refund request context: ${error.message}`);
  }

  for (const row of (data ?? []) as CashRefundRequestContextRow[]) {
    contextById.set(row.id, row);
  }

  return contextById;
}

function getCashTransactionTitle(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
) {
  switch (transaction.type) {
    case "charge":
      return getChargePaymentTitle(transaction, sourceContext);
    case "charge_refund":
      return "충전 환불";
    case "match_refund":
      return "매치 환급";
    case "refund_hold":
      return getRefundHoldTitle(transaction, sourceContext);
    case "refund_release":
      return "환불 미처리 금액 반환";
    case "adjustment":
      return "운영 보정";
    case "match_debit":
    default:
      return "매치 신청(캐시 사용)";
  }
}

function getCashTransactionMetaLabel(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
  title: string,
) {
  const dateLabel = formatCompactDateLabel(new Date(transaction.createdAt));
  const detail = getCashTransactionMetaDetail(transaction, sourceContext, title);

  return `${dateLabel} · ${detail}`;
}

function getCashTransactionMetaDetail(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
  title: string,
) {
  if (transaction.sourceType === "match_application" && transaction.sourceId) {
    const application = sourceContext.matchApplicationsById.get(transaction.sourceId);
    const match = normalizeMatch(application?.match ?? null);

    if (match) {
      return getMatchTransactionMetaDetail(match, transaction.type);
    }
  }

  if (transaction.sourceType === "refund_request" && transaction.sourceId) {
    const refundRequest = sourceContext.refundRequestsById.get(transaction.sourceId);

    if (refundRequest) {
      return getRefundRequestMetaDetail(transaction.type, refundRequest);
    }
  }

  if (transaction.type === "charge" && title !== "캐시 충전") {
    return "충전 완료";
  }

  return transaction.memo || title;
}

function getMatchTransactionMetaDetail(
  match: MatchRow,
  type: CashTransactionEntity["type"],
) {
  const title = match.title?.trim() || "매치 정보 확인 불가";
  const venueName = match.venue_name?.trim();
  const matchLabel = venueName ? `${title} · ${venueName}` : title;

  if (type === "match_refund") {
    return `환급 대상 · ${matchLabel}`;
  }

  return matchLabel;
}

function getRefundRequestMetaDetail(
  type: CashTransactionEntity["type"],
  refundRequest: CashRefundRequestContextRow,
) {
  if (type === "refund_release") {
    return "환불 신청 반려 · 캐시 반환";
  }

  switch (refundRequest.status) {
    case "processed":
      return "캐시 환불 완료";
    case "rejected":
      return "캐시 환불 반려";
    case "cancelled":
      return "캐시 환불 취소";
    case "pending":
    default:
      return "캐시 환불 신청 접수";
  }
}

function getChargePaymentTitle(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
) {
  if (!transaction.sourceId) {
    return "캐시 충전";
  }

  const chargeOrder = sourceContext.chargeOrdersById.get(transaction.sourceId);
  const paymentMethodLabel = getTossPaymentMethodLabel(chargeOrder?.provider_snapshot ?? null);

  return paymentMethodLabel ? `캐시 충전(${paymentMethodLabel})` : "캐시 충전";
}

function getRefundHoldTitle(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
) {
  if (!transaction.sourceId) {
    return "캐시 환불 신청";
  }

  const refundRequest = sourceContext.refundRequestsById.get(transaction.sourceId);

  switch (refundRequest?.status) {
    case "processed":
      return withPaymentMethodLabel(
        "캐시 환불 완료",
        getRefundPaymentMethodLabel(transaction, sourceContext),
      );
    case "rejected":
      return "캐시 환불 반려";
    case "cancelled":
      return "캐시 환불 취소";
    case "pending":
    default:
      return "캐시 환불 신청";
  }
}

function getRefundPaymentMethodLabel(
  transaction: CashTransactionEntity,
  sourceContext: CashTransactionSourceContext,
) {
  if (!transaction.sourceId) {
    return null;
  }

  return (
    sourceContext.refundPaymentMethodLabelsByRequestId.get(transaction.sourceId) ??
    null
  );
}

function withPaymentMethodLabel(title: string, paymentMethodLabel: string | null) {
  return paymentMethodLabel ? `${title}(${paymentMethodLabel})` : title;
}

function getTossPaymentMethodLabel(providerSnapshot: Record<string, unknown> | null) {
  const easyPay = getRecordValue(providerSnapshot, "easyPay");
  const easyPayProvider = getStringValue(easyPay?.provider);

  if (easyPayProvider) {
    return getEasyPayProviderLabel(easyPayProvider);
  }

  const method = getStringValue(providerSnapshot?.method);

  if (!method) {
    return null;
  }

  return getPaymentMethodLabel(method);
}

function getEasyPayProviderLabel(provider: string) {
  const normalizedProvider = provider.replace(/\s/g, "").toUpperCase();

  switch (normalizedProvider) {
    case "KAKAOPAY":
    case "카카오페이":
      return "카카오페이";
    case "NAVERPAY":
    case "네이버페이":
      return "네이버페이";
    case "TOSSPAY":
    case "토스페이":
      return "토스페이";
    default:
      return provider.trim();
  }
}

function getPaymentMethodLabel(method: string) {
  const normalizedMethod = method.replace(/\s/g, "").toUpperCase();

  switch (normalizedMethod) {
    case "CARD":
    case "카드":
      return "카드";
    case "TRANSFER":
    case "계좌이체":
      return "계좌이체";
    case "EASYPAY":
    case "간편결제":
      return "간편결제";
    case "VIRTUALACCOUNT":
    case "가상계좌":
      return "가상계좌";
    case "MOBILEPHONE":
    case "휴대폰":
      return "휴대폰";
    default:
      return method.trim();
  }
}

function getRecordValue(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  const nextValue = value?.[key];

  return isRecord(nextValue) ? nextValue : null;
}

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getCashTransactionTone(
  type: CashTransactionEntity["type"],
  deltaAmount: number,
) {
  if (type === "match_debit" || type === "refund_hold" || deltaAmount < 0) {
    return "danger";
  }

  if (type === "adjustment") {
    return "muted";
  }

  return "accent";
}
