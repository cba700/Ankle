import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CashTransactionType =
  | "charge"
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
  createdAt: string;
  failureCode: string | null;
  failureMessage: string | null;
  id: string;
  orderId: string;
  status: CashChargeOrderStatus;
  tossPaymentKey: string | null;
  updatedAt: string;
  userId: string;
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
  created_at: string;
  failure_code: string | null;
  failure_message: string | null;
  id: string;
  order_id: string;
  status: CashChargeOrderStatus;
  toss_payment_key: string | null;
  updated_at: string;
  user_id: string;
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
      "id, user_id, order_id, amount, status, toss_payment_key, approved_at, failure_code, failure_message, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash charge orders: ${error.message}`);
  }

  return ((data ?? []) as CashChargeOrderRow[]).map(mapCashChargeOrder);
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
    createdAt: row.created_at,
    failureCode: row.failure_code,
    failureMessage: row.failure_message,
    id: row.id,
    orderId: row.order_id,
    status: row.status,
    tossPaymentKey: row.toss_payment_key,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}
