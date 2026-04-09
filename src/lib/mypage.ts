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
import { assertCashFoundationSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/auth";

type ProfileRow = {
  avatar_url: string | null;
  display_name: string | null;
  role: UserRole | null;
};

type MatchRow = {
  slug: string | null;
  start_at: string | null;
  title: string | null;
  venue_name: string | null;
};

type ApplicationRow = {
  applied_at: string;
  id: string;
  match: MatchRow | MatchRow[] | null;
  price_snapshot: number;
  refunded_amount: number;
  status: MyPageApplicationStatus;
};

export type MyPageApplicationStatus =
  | "confirmed"
  | "cancelled_by_user"
  | "cancelled_by_admin";

export type MyPageProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  providerLabel: string;
  role: UserRole;
};

export type MyPageApplication = {
  appliedAt: string;
  appliedDateKey: string;
  cashLabel: string;
  href: string | null;
  id: string;
  metaLabel: string;
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

export type MyPageData = {
  applications: MyPageApplication[];
  cashBalanceLabel: string;
  cashTransactions: MyPageCashTransaction[];
  profile: MyPageProfile;
};

const APPLICATION_SELECT = `
  id,
  status,
  applied_at,
  price_snapshot,
  refunded_amount,
  match:matches!match_applications_match_id_fkey (
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

  const [
    { data: profile },
    { data: applications, error: applicationError },
    cashAccount,
    cashTransactions,
  ] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("match_applications")
        .select(APPLICATION_SELECT)
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false }),
      getCashAccountByUserId(supabase, user.id),
      listCashTransactionsByUserId(supabase, user.id),
    ]);

  const typedProfile = profile as ProfileRow | null;

  if (applicationError) {
    throw new Error(`Failed to load mypage applications: ${applicationError.message}`);
  }

  return {
    applications: ((applications ?? []) as ApplicationRow[]).map(mapApplication),
    cashBalanceLabel: `${formatMoney(cashAccount?.balance ?? 0)}원`,
    cashTransactions: cashTransactions.map(mapCashTransaction),
    profile: {
      avatarUrl: typedProfile?.avatar_url ?? null,
      displayName: getDisplayName(user, typedProfile),
      email: user.email ?? "이메일 정보 없음",
      providerLabel: getProviderLabel(user),
      role: typedProfile?.role ?? role,
    },
  };
}

function mapApplication(application: ApplicationRow): MyPageApplication {
  const match = normalizeMatch(application.match);

  return {
    appliedAt: application.applied_at,
    appliedDateKey: toDateKey(new Date(application.applied_at)),
    cashLabel: getCashLabel(application),
    href: match?.slug ? `/match/${match.slug}` : null,
    id: application.id,
    metaLabel: getMetaLabel(match, application.applied_at),
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
  if (application.refunded_amount > 0) {
    return `차감 ${formatMoney(application.price_snapshot)}원 · 환급 ${formatMoney(application.refunded_amount)}원`;
  }

  if (application.status !== "confirmed") {
    return `차감 ${formatMoney(application.price_snapshot)}원 · 환급 없음`;
  }

  return `차감 ${formatMoney(application.price_snapshot)}원`;
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

function getCashTransactionTitle(type: CashTransactionEntity["type"]) {
  switch (type) {
    case "charge":
      return "캐시 충전";
    case "charge_refund":
      return "충전 환불";
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
  type: CashTransactionEntity["type"],
  deltaAmount: number,
) {
  if (type === "match_debit" || deltaAmount < 0) {
    return "danger";
  }

  if (type === "adjustment") {
    return "muted";
  }

  return "accent";
}
