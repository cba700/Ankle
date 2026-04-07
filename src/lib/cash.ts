import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CashTransactionType =
  | "charge"
  | "charge_refund"
  | "match_debit"
  | "match_refund"
  | "adjustment";

export type CashSourceType =
  | "charge_order"
  | "match_application"
  | "admin_adjustment";

export type CashChargeOrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

export type CashAccountEntity = {
  balance: number;
  userId: string;
};

export type CashTransactionEntity = {
  balanceAfter: number;
  createdAt: string;
  deltaAmount: number;
  id: string;
  memo: string;
  sourceId: string | null;
  sourceType: CashSourceType;
  type: CashTransactionType;
  userId: string;
};

export type CashChargeOrderEntity = {
  amount: number;
  approvedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  orderId: string;
  refundedAmount: number;
  refundedAt: string | null;
  status: CashChargeOrderStatus;
  tossPaymentKey: string | null;
  updatedAt: string;
  userId: string;
};

export type CashChargeOrderEventEntity = {
  createdAt: string;
  eventType: string;
  id: string;
  orderId: string;
  processedResult: string;
  providerEventId: string;
};

type CashAccountRow = {
  balance: number;
  updated_at?: string;
  user_id: string;
};

type CashTransactionRow = {
  balance_after: number;
  created_at: string;
  delta_amount: number;
  id: string;
  memo: string;
  source_id: string | null;
  source_type: CashSourceType;
  type: CashTransactionType;
  user_id: string;
};

type CashChargeOrderRow = {
  amount: number;
  approved_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  failure_code: string | null;
  failure_message: string | null;
  id: string;
  last_error_code: string | null;
  last_error_message: string | null;
  order_id: string;
  refunded_amount: number;
  refunded_at: string | null;
  status: CashChargeOrderStatus;
  toss_payment_key: string | null;
  updated_at: string;
  user_id: string;
};

type CashChargeOrderEventRow = {
  created_at: string;
  event_type: string;
  id: string;
  order_id: string;
  processed_result: string;
  provider_event_id: string;
};

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

export async function getCashAccountByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("cash_accounts")
    .select("user_id, balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load cash account: ${error.message}`);
  }

  const row = data as CashAccountRow | null;

  return row
    ? {
        balance: row.balance,
        userId: row.user_id,
      }
    : null;
}

export async function listCashTransactionsByUserId(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_transactions")
    .select(
      "id, user_id, delta_amount, balance_after, type, source_type, source_id, memo, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash transactions: ${error.message}`);
  }

  return ((data ?? []) as CashTransactionRow[]).map(mapCashTransaction);
}

export async function listRecentCashTransactions(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_transactions")
    .select(
      "id, user_id, delta_amount, balance_after, type, source_type, source_id, memo, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load recent cash transactions: ${error.message}`);
  }

  return ((data ?? []) as CashTransactionRow[]).map(mapCashTransaction);
}

export async function listRecentCashChargeOrders(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_charge_orders")
    .select(
      "id, user_id, order_id, amount, status, toss_payment_key, approved_at, failure_code, failure_message, last_error_code, last_error_message, refunded_amount, refunded_at, cancel_reason, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash charge orders: ${error.message}`);
  }

  return ((data ?? []) as CashChargeOrderRow[]).map(mapCashChargeOrder);
}

export async function listCashChargeOrdersByUserId(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_charge_orders")
    .select(
      "id, user_id, order_id, amount, status, toss_payment_key, approved_at, failure_code, failure_message, last_error_code, last_error_message, refunded_amount, refunded_at, cancel_reason, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash charge orders: ${error.message}`);
  }

  return ((data ?? []) as CashChargeOrderRow[]).map(mapCashChargeOrder);
}

export async function listRecentCashChargeOrderEvents(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_charge_order_events")
    .select("id, order_id, provider_event_id, event_type, processed_result, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load charge order events: ${error.message}`);
  }

  return ((data ?? []) as CashChargeOrderEventRow[]).map((row) => ({
    createdAt: row.created_at,
    eventType: row.event_type,
    id: row.id,
    orderId: row.order_id,
    processedResult: row.processed_result,
    providerEventId: row.provider_event_id,
  }));
}

export async function listCashAccounts(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_accounts")
    .select("user_id, balance, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash accounts: ${error.message}`);
  }

  return ((data ?? []) as CashAccountRow[]).map((row) => ({
    balance: row.balance,
    userId: row.user_id,
  }));
}

function mapCashTransaction(row: CashTransactionRow): CashTransactionEntity {
  return {
    balanceAfter: row.balance_after,
    createdAt: row.created_at,
    deltaAmount: row.delta_amount,
    id: row.id,
    memo: row.memo,
    sourceId: row.source_id,
    sourceType: row.source_type,
    type: row.type,
    userId: row.user_id,
  };
}

function mapCashChargeOrder(row: CashChargeOrderRow): CashChargeOrderEntity {
  return {
    amount: row.amount,
    approvedAt: row.approved_at,
    cancelReason: row.cancel_reason,
    createdAt: row.created_at,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    id: row.id,
    lastErrorCode: row.last_error_code,
    lastErrorMessage: row.last_error_message,
    orderId: row.order_id,
    refundedAmount: row.refunded_amount,
    refundedAt: row.refunded_at,
    status: row.status,
    tossPaymentKey: row.toss_payment_key,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}
