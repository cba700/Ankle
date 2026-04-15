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

  return {
    applications: ((applications ?? []) as ApplicationRow[]).map(mapApplication),
    cashBalanceAmount: cashAccount?.balance ?? 0,
    cashBalanceLabel: `${formatMoney(cashAccount?.balance ?? 0)}원`,
    cashTransactions: cashTransactions.map(mapCashTransaction),
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

function mapCashTransaction(transaction: CashTransactionEntity): MyPageCashTransaction {
  const amount = Math.abs(transaction.deltaAmount);
  const isPositive = transaction.deltaAmount > 0;

  return {
    amountLabel: `${isPositive ? "+" : "-"}${formatMoney(amount)}원`,
    balanceLabel: `잔액 ${formatMoney(transaction.balanceAfter)}원`,
    id: transaction.id,
    metaLabel: `${formatCompactDateLabel(new Date(transaction.createdAt))} · ${transaction.memo || getCashTransactionTitle(transaction.type)}`,
    title: getCashTransactionTitle(transaction.type),
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

  if (application.coupon_discount_amount > 0 && application.refunded_amount > 0) {
    return `쿠폰 ${formatMoney(application.coupon_discount_amount)}원 · 차감 ${formatMoney(chargedAmount)}원 · 환급 ${formatMoney(application.refunded_amount)}원`;
  }

  if (application.coupon_discount_amount > 0 && application.status !== "confirmed") {
    return `쿠폰 ${formatMoney(application.coupon_discount_amount)}원 · 차감 ${formatMoney(chargedAmount)}원 · 환급 없음`;
  }

  if (application.coupon_discount_amount > 0) {
    return `쿠폰 ${formatMoney(application.coupon_discount_amount)}원 · 차감 ${formatMoney(chargedAmount)}원`;
  }

  if (application.refunded_amount > 0) {
    return `차감 ${formatMoney(chargedAmount)}원 · 환급 ${formatMoney(application.refunded_amount)}원`;
  }

  if (application.status !== "confirmed") {
    return `차감 ${formatMoney(chargedAmount)}원 · 환급 없음`;
  }

  return `차감 ${formatMoney(chargedAmount)}원`;
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

  return `${formatCompactDateLabel(new Date(coupon.issuedAt))} 발급`;
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

function getCashTransactionTitle(type: CashTransactionEntity["type"]) {
  switch (type) {
    case "charge":
      return "캐시 충전";
    case "charge_refund":
      return "충전 환불";
    case "match_refund":
      return "매치 환급";
    case "refund_hold":
      return "캐시 환불 신청";
    case "refund_release":
      return "환불 신청 반려";
    case "adjustment":
      return "운영 보정";
    case "match_debit":
    default:
      return "매치 신청 차감";
  }
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
