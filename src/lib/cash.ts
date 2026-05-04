import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CashTransactionType =
  | "charge"
  | "charge_refund"
  | "match_debit"
  | "match_refund"
  | "adjustment"
  | "refund_hold"
  | "refund_release";

export type CashSourceType =
  | "charge_order"
  | "match_application"
  | "admin_adjustment"
  | "refund_request";

export type CashChargeOrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

export type CashRefundRequestStatus =
  | "pending"
  | "processed"
  | "rejected"
  | "cancelled";

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

export type CashRefundRequestEntity = {
  accountHolder: string | null;
  accountNumber: string | null;
  bankName: string | null;
  createdAt: string;
  decisionNote: string | null;
  holdTransactionId: string | null;
  id: string;
  processedAt: string | null;
  rejectedAt: string | null;
  releaseTransactionId: string | null;
  requestedAmount: number;
  status: CashRefundRequestStatus;
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

type CashRefundRequestRow = {
  account_holder: string | null;
  account_number: string | null;
  bank_name: string | null;
  created_at: string;
  decision_note: string | null;
  hold_transaction_id: string | null;
  id: string;
  processed_at: string | null;
  rejected_at: string | null;
  release_transaction_id: string | null;
  requested_amount: number;
  status: CashRefundRequestStatus;
  updated_at: string;
  user_id: string;
};

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

type RefundableChargeOrderRow = {
  amount: number;
  provider_snapshot: Record<string, unknown> | null;
  refunded_amount: number | null;
};

type RefundCancellationMethodRow = {
  provider_snapshot: Record<string, unknown> | null;
  refund_request_id: string;
};

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

export async function getOriginalPaymentRefundableCashAmountByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const summary = await getOriginalPaymentRefundableCashSummaryByUserId(
    supabase,
    userId,
  );

  return summary.amount;
}

export async function getOriginalPaymentRefundableCashSummaryByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const [cashAccount, chargeOrdersResult] = await Promise.all([
    getCashAccountByUserId(supabase, userId),
    supabase
      .from("cash_charge_orders")
      .select("amount, refunded_amount, provider_snapshot")
      .eq("user_id", userId)
      .eq("status", "paid")
      .not("toss_payment_key", "is", null),
  ]);

  if (chargeOrdersResult.error) {
    throw new Error(
      `Failed to load refundable charge orders: ${chargeOrdersResult.error.message}`,
    );
  }

  const refundableOrders = (
    (chargeOrdersResult.data ?? []) as RefundableChargeOrderRow[]
  ).filter((order) => order.amount - (order.refunded_amount ?? 0) > 0);
  const refundableChargeAmount = refundableOrders.reduce(
    (total, order) => total + order.amount - (order.refunded_amount ?? 0),
    0,
  );

  return {
    amount: Math.min(cashAccount?.balance ?? 0, refundableChargeAmount),
    paymentMethodLabel: formatPaymentMethodLabels(
      refundableOrders.map((order) =>
        getPaymentMethodLabelFromProviderSnapshot(order.provider_snapshot),
      ),
    ),
  };
}

export async function listCashRefundRequestPaymentMethodLabels(
  supabase: SupabaseServerClient,
  refundRequestIds: string[],
) {
  if (refundRequestIds.length === 0) {
    return new Map<string, string>();
  }

  const { data, error } = await supabase
    .from("cash_refund_request_cancellations")
    .select("refund_request_id, provider_snapshot")
    .in("refund_request_id", refundRequestIds)
    .eq("status", "succeeded");

  if (error) {
    throw new Error(
      `Failed to load refund payment methods: ${error.message}`,
    );
  }

  const labelsByRequestId = new Map<string, string[]>();

  for (const row of (data ?? []) as RefundCancellationMethodRow[]) {
    const labels = labelsByRequestId.get(row.refund_request_id) ?? [];
    labels.push(getPaymentMethodLabelFromProviderSnapshot(row.provider_snapshot));
    labelsByRequestId.set(row.refund_request_id, labels);
  }

  return new Map(
    Array.from(labelsByRequestId.entries()).map(([requestId, labels]) => [
      requestId,
      formatPaymentMethodLabels(labels),
    ]),
  );
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

export async function getPendingCashRefundRequestByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("cash_refund_requests")
    .select(
      "id, user_id, requested_amount, bank_name, account_number, account_holder, status, hold_transaction_id, release_transaction_id, decision_note, processed_at, rejected_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load pending cash refund request: ${error.message}`);
  }

  const row = data as CashRefundRequestRow | null;

  return row ? mapCashRefundRequest(row) : null;
}

export async function listRecentCashRefundRequests(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("cash_refund_requests")
    .select(
      "id, user_id, requested_amount, bank_name, account_number, account_holder, status, hold_transaction_id, release_transaction_id, decision_note, processed_at, rejected_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cash refund requests: ${error.message}`);
  }

  return ((data ?? []) as CashRefundRequestRow[]).map(mapCashRefundRequest);
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

function mapCashRefundRequest(row: CashRefundRequestRow): CashRefundRequestEntity {
  return {
    accountHolder: row.account_holder,
    accountNumber: row.account_number,
    bankName: row.bank_name,
    createdAt: row.created_at,
    decisionNote: row.decision_note,
    holdTransactionId: row.hold_transaction_id,
    id: row.id,
    processedAt: row.processed_at,
    rejectedAt: row.rejected_at,
    releaseTransactionId: row.release_transaction_id,
    requestedAmount: row.requested_amount,
    status: row.status,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function getPaymentMethodLabelFromProviderSnapshot(
  snapshot: Record<string, unknown> | null,
) {
  if (!snapshot) {
    return "충전 시 사용한 결제수단";
  }

  const easyPay = getRecordValue(snapshot, "easyPay");
  const easyPayProvider = getStringValue(easyPay, "provider");

  if (easyPayProvider) {
    return easyPayProvider;
  }

  const method = getStringValue(snapshot, "method");

  if (method) {
    return method;
  }

  return "충전 시 사용한 결제수단";
}

function formatPaymentMethodLabels(labels: string[]) {
  const uniqueLabels = Array.from(
    new Set(labels.map((label) => label.trim()).filter(Boolean)),
  );

  if (uniqueLabels.length === 0) {
    return "충전 시 사용한 결제수단";
  }

  if (uniqueLabels.length === 1) {
    return uniqueLabels[0];
  }

  return `${uniqueLabels[0]} 외 ${uniqueLabels.length - 1}개 결제수단`;
}

function getRecordValue(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const value = record[key];
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function getStringValue(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
