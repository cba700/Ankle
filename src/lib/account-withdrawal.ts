import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AccountStatus = "active" | "withdrawal_pending" | "withdrawn";

export type AccountWithdrawalRequestStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type AccountWithdrawalRequestEntity = {
  cancelledAt: string | null;
  completedAt: string | null;
  id: string;
  refundRequestId: string | null;
  requestedAt: string;
  status: AccountWithdrawalRequestStatus;
  userId: string;
};

export type AccountWithdrawalPreview = {
  futureMatchCount: number;
  pendingChargeOrderCount: number;
};

type AccountWithdrawalRequestRow = {
  cancelled_at: string | null;
  completed_at: string | null;
  id: string;
  refund_request_id: string | null;
  requested_at: string;
  status: AccountWithdrawalRequestStatus;
  user_id: string;
};

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

export function normalizeAccountStatus(value: unknown): AccountStatus {
  if (value === "withdrawal_pending" || value === "withdrawn") {
    return value;
  }

  return "active";
}

export function getAccountStatusLoginErrorCode(status: AccountStatus) {
  if (status === "withdrawal_pending") {
    return "account_withdrawal_pending";
  }

  if (status === "withdrawn") {
    return "account_withdrawn";
  }

  return undefined;
}

export async function getPendingAccountWithdrawalRequestByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("account_withdrawal_requests")
    .select(
      "id, user_id, refund_request_id, status, requested_at, completed_at, cancelled_at",
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load pending account withdrawal request: ${error.message}`);
  }

  const row = data as AccountWithdrawalRequestRow | null;

  return row ? mapAccountWithdrawalRequest(row) : null;
}

export async function listWithdrawalRequestLinksByRefundRequestIds(
  supabase: SupabaseServerClient,
  refundRequestIds: string[],
) {
  if (refundRequestIds.length === 0) {
    return new Map<string, AccountWithdrawalRequestEntity>();
  }

  const { data, error } = await supabase
    .from("account_withdrawal_requests")
    .select(
      "id, user_id, refund_request_id, status, requested_at, completed_at, cancelled_at",
    )
    .in("refund_request_id", refundRequestIds);

  if (error) {
    throw new Error(`Failed to load withdrawal request links: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as AccountWithdrawalRequestRow[])
      .filter((row) => typeof row.refund_request_id === "string")
      .map((row) => [row.refund_request_id as string, mapAccountWithdrawalRequest(row)]),
  );
}

export async function getAccountWithdrawalPreview(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<AccountWithdrawalPreview> {
  const nowIso = new Date().toISOString();
  const [{ data: upcomingMatches, error: upcomingMatchesError }, { count, error: pendingChargeOrderError }] =
    await Promise.all([
      supabase
        .from("match_applications")
        .select("id, matches!inner(start_at)")
        .eq("user_id", userId)
        .eq("status", "confirmed")
        .gt("matches.start_at", nowIso),
      supabase
        .from("cash_charge_orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending"),
    ]);

  if (upcomingMatchesError) {
    throw new Error(`Failed to load upcoming match applications: ${upcomingMatchesError.message}`);
  }

  if (pendingChargeOrderError) {
    throw new Error(`Failed to load pending charge orders: ${pendingChargeOrderError.message}`);
  }

  return {
    futureMatchCount: (upcomingMatches ?? []).length,
    pendingChargeOrderCount: count ?? 0,
  };
}

function mapAccountWithdrawalRequest(
  row: AccountWithdrawalRequestRow,
): AccountWithdrawalRequestEntity {
  return {
    cancelledAt: row.cancelled_at,
    completedAt: row.completed_at,
    id: row.id,
    refundRequestId: row.refund_request_id,
    requestedAt: row.requested_at,
    status: row.status,
    userId: row.user_id,
  };
}
