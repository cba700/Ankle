import "server-only";

import { sendCashChargedNotification } from "@/lib/notifications";
import {
  confirmTossPayment,
  getTossErrorCode,
  getTossErrorMessage,
  getTossPayment,
  validateConfirmedTossPayment,
} from "./toss-server";

export type ChargeOrderStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

export type ChargeOrderLookup = {
  amount: number;
  id: string;
  order_id: string;
  status: ChargeOrderStatus;
  toss_payment_key: string | null;
  user_id: string;
};

type ChargeOrderEventLookup = {
  event_type: string;
  id: string;
  payload: Record<string, unknown> | null;
  processed_result: string;
};

type ChargeOrderBalanceLookup = {
  balance: number;
};

type ErrorStatus = "failed" | null;

type TossChargeSuccessResult = {
  chargedAmount: number;
  method: string | null;
  ok: true;
  orderId: string;
  remainingCash: number;
  retryable: false;
  source: "already_paid" | "confirmed" | "reconciled";
  status: "paid";
};

type TossChargeFailureResult = {
  code: string;
  httpStatus: number;
  message: string;
  ok: false;
  orderId: string;
  retryable: boolean;
  status?: ChargeOrderStatus;
};

export type TossChargeResult =
  | TossChargeSuccessResult
  | TossChargeFailureResult;

export async function finalizeTossChargeOrder(
  admin: any,
  {
    amount,
    expectedUserId,
    orderId,
    paymentKey,
  }: {
    amount?: number;
    expectedUserId?: string;
    orderId: string;
    paymentKey: string;
  },
): Promise<TossChargeResult> {
  const chargeOrder = await getChargeOrderByOrderId(admin, orderId);

  if (!chargeOrder) {
    return buildFailureResult(orderId, {
      code: "CHARGE_ORDER_NOT_FOUND",
      httpStatus: 404,
      message: "충전 주문을 찾을 수 없습니다.",
    });
  }

  if (expectedUserId && chargeOrder.user_id !== expectedUserId) {
    return buildFailureResult(orderId, {
      code: "FORBIDDEN_ORDER_ACCESS",
      httpStatus: 403,
      message: "다른 사용자의 주문에는 접근할 수 없습니다.",
      status: chargeOrder.status,
    });
  }

  if (typeof amount === "number" && chargeOrder.amount !== amount) {
    await markChargeOrderError(admin, chargeOrder.id, {
      errorCode: "AMOUNT_MISMATCH",
      errorMessage: "결제 인증 금액이 주문 원장 금액과 일치하지 않습니다.",
      status: "failed",
    });

    return buildFailureResult(orderId, {
      code: "AMOUNT_MISMATCH",
      httpStatus: 400,
      message: "결제 인증 금액이 주문 금액과 일치하지 않습니다.",
      status: "failed",
    });
  }

  if (chargeOrder.status === "paid") {
    return buildAlreadyPaidResult(admin, chargeOrder, paymentKey);
  }

  if (chargeOrder.status !== "pending") {
    return buildFailureResult(orderId, {
      code: "ORDER_NOT_PENDING",
      httpStatus: 409,
      message: "대기 중인 주문만 승인할 수 있습니다.",
      status: chargeOrder.status,
    });
  }

  try {
    const confirmResult = await confirmTossPayment({
      amount: chargeOrder.amount,
      orderId,
      paymentKey,
    });

    if (!confirmResult.ok) {
      const recovered = await reconcileApprovedTossChargeOrder(admin, {
        chargeOrder,
        paymentKey,
      });

      if (recovered.ok) {
        return recovered;
      }

      const errorCode = getTossErrorCode(confirmResult.payload);
      const errorMessage = getTossErrorMessage(confirmResult.payload);

      await markChargeOrderError(admin, chargeOrder.id, {
        errorCode,
        errorMessage,
        providerSnapshot: confirmResult.payload,
        status: confirmResult.status >= 500 ? null : "failed",
      });

      return buildFailureResult(orderId, {
        code: errorCode,
        httpStatus: confirmResult.status >= 500 ? 502 : 400,
        message: errorMessage,
        retryable: confirmResult.status >= 500,
        status: confirmResult.status >= 500 ? "pending" : "failed",
      });
    }

    const validatedPayment = validateConfirmedTossPayment(confirmResult.payload, {
      amount: chargeOrder.amount,
      orderId,
      paymentKey,
    });

    if (!validatedPayment.ok) {
      await markChargeOrderError(admin, chargeOrder.id, {
        errorCode: validatedPayment.code,
        errorMessage: validatedPayment.message,
        providerSnapshot: confirmResult.payload,
        status: null,
      });

      return buildFailureResult(orderId, {
        code: validatedPayment.code,
        httpStatus: 409,
        message: validatedPayment.message,
        status: chargeOrder.status,
      });
    }

    return applyApprovedChargeOrder(admin, {
      chargeOrder,
      method: validatedPayment.method,
      orderId,
      paymentKey,
      providerSnapshot: validatedPayment.payload,
      source: "confirmed",
    });
  } catch (error) {
    const recovered = await reconcileApprovedTossChargeOrder(admin, {
      chargeOrder,
      paymentKey,
    });

    if (recovered.ok) {
      return recovered;
    }

    await markChargeOrderError(admin, chargeOrder.id, {
      errorCode: "TOSS_CONFIRM_REQUEST_FAILED",
      errorMessage:
        error instanceof Error
          ? error.message
          : "토스 승인 API 호출 중 알 수 없는 오류가 발생했습니다.",
      status: null,
    });

    return buildFailureResult(orderId, {
      code: "TOSS_CONFIRM_REQUEST_FAILED",
      httpStatus: 502,
      message: "토스 승인 서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      retryable: true,
      status: "pending",
    });
  }
}

export async function reconcileApprovedTossChargeOrder(
  admin: any,
  {
    chargeOrder,
    orderId,
    paymentKey,
  }: {
    chargeOrder?: ChargeOrderLookup | null;
    orderId?: string;
    paymentKey: string;
  },
): Promise<TossChargeResult> {
  const currentOrder =
    chargeOrder ?? (orderId ? await getChargeOrderByOrderId(admin, orderId) : null);

  if (!currentOrder) {
    return buildFailureResult(orderId ?? "unknown", {
      code: "CHARGE_ORDER_NOT_FOUND",
      httpStatus: 404,
      message: "충전 주문을 찾을 수 없습니다.",
    });
  }

  if (currentOrder.status === "paid") {
    return buildAlreadyPaidResult(admin, currentOrder, paymentKey);
  }

  if (currentOrder.status !== "pending") {
    return buildFailureResult(currentOrder.order_id, {
      code: "ORDER_NOT_PENDING",
      httpStatus: 409,
      message: "대기 중인 주문만 승인할 수 있습니다.",
      status: currentOrder.status,
    });
  }

  try {
    const paymentResult = await getTossPayment(paymentKey);

    if (!paymentResult.ok) {
      const errorCode = getTossErrorCode(paymentResult.payload);
      const errorMessage = getTossErrorMessage(paymentResult.payload);

      await markChargeOrderError(admin, currentOrder.id, {
        errorCode,
        errorMessage,
        providerSnapshot: paymentResult.payload,
        status: paymentResult.status >= 500 ? null : "failed",
      });

      return buildFailureResult(currentOrder.order_id, {
        code: errorCode,
        httpStatus: paymentResult.status >= 500 ? 502 : 400,
        message: errorMessage,
        retryable: paymentResult.status >= 500,
        status: paymentResult.status >= 500 ? "pending" : "failed",
      });
    }

    const validatedPayment = validateConfirmedTossPayment(paymentResult.payload, {
      amount: currentOrder.amount,
      orderId: currentOrder.order_id,
      paymentKey,
    });

    if (!validatedPayment.ok) {
      await markChargeOrderError(admin, currentOrder.id, {
        errorCode: validatedPayment.code,
        errorMessage: validatedPayment.message,
        providerSnapshot: paymentResult.payload,
        status: null,
      });

      return buildFailureResult(currentOrder.order_id, {
        code: validatedPayment.code,
        httpStatus: 409,
        message: validatedPayment.message,
        status: currentOrder.status,
      });
    }

    return applyApprovedChargeOrder(admin, {
      chargeOrder: currentOrder,
      method: validatedPayment.method,
      orderId: currentOrder.order_id,
      paymentKey,
      providerSnapshot: validatedPayment.payload,
      source: "reconciled",
    });
  } catch (error) {
    await markChargeOrderError(admin, currentOrder.id, {
      errorCode: "TOSS_PAYMENT_LOOKUP_FAILED",
      errorMessage:
        error instanceof Error
          ? error.message
          : "토스 결제 조회 중 알 수 없는 오류가 발생했습니다.",
      status: null,
    });

    return buildFailureResult(currentOrder.order_id, {
      code: "TOSS_PAYMENT_LOOKUP_FAILED",
      httpStatus: 502,
      message: "토스 결제 상태를 다시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      retryable: true,
      status: "pending",
    });
  }
}

export async function retryPendingTossChargeOrder(
  admin: any,
  orderId: string,
): Promise<TossChargeResult> {
  const chargeOrder = await getChargeOrderByOrderId(admin, orderId);

  if (!chargeOrder) {
    return buildFailureResult(orderId, {
      code: "CHARGE_ORDER_NOT_FOUND",
      httpStatus: 404,
      message: "충전 주문을 찾을 수 없습니다.",
    });
  }

  if (chargeOrder.status === "paid") {
    return buildAlreadyPaidResult(
      admin,
      chargeOrder,
      chargeOrder.toss_payment_key ?? null,
    );
  }

  if (chargeOrder.status !== "pending") {
    return buildFailureResult(orderId, {
      code: "ORDER_NOT_PENDING",
      httpStatus: 409,
      message: "대기 중인 주문만 재처리할 수 있습니다.",
      status: chargeOrder.status,
    });
  }

  const latestEvent = await getLatestChargeOrderEventByOrderId(admin, orderId);
  const payload = latestEvent?.payload ?? null;
  const paymentKey = getWebhookPaymentKey(payload);

  if (!paymentKey) {
    return buildFailureResult(orderId, {
      code: "PAYMENT_KEY_NOT_FOUND",
      httpStatus: 404,
      message: "최근 결제 이벤트에서 paymentKey를 찾지 못했습니다.",
      status: chargeOrder.status,
    });
  }

  if (getWebhookPaymentStatus(payload) === "DONE") {
    return reconcileApprovedTossChargeOrder(admin, {
      chargeOrder,
      paymentKey,
    });
  }

  return finalizeTossChargeOrder(admin, {
    orderId,
    paymentKey,
  });
}

export async function getChargeOrderByOrderId(admin: any, orderId: string) {
  const { data, error } = await admin
    .from("cash_charge_orders")
    .select("id, user_id, order_id, amount, status, toss_payment_key")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load charge order: ${error.message}`);
  }

  return (data ?? null) as ChargeOrderLookup | null;
}

export async function getLatestChargeOrderEventByOrderId(
  admin: any,
  orderId: string,
) {
  const { data, error } = await admin
    .from("cash_charge_order_events")
    .select("id, event_type, processed_result, payload")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load charge order event: ${error.message}`);
  }

  return (data ?? null) as ChargeOrderEventLookup | null;
}

export async function getChargeOrderEventByProviderEventId(
  admin: any,
  providerEventId: string,
) {
  const { data, error } = await admin
    .from("cash_charge_order_events")
    .select("id, event_type, processed_result, payload")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load charge order event: ${error.message}`);
  }

  return (data ?? null) as ChargeOrderEventLookup | null;
}

export async function markChargeOrderError(
  admin: any,
  chargeOrderId: string,
  {
    errorCode,
    errorMessage,
    providerSnapshot,
    status,
  }: {
    errorCode: string;
    errorMessage: string;
    providerSnapshot?: Record<string, unknown> | null;
    status: ErrorStatus;
  },
) {
  const updatePayload: Record<string, unknown> = {
    last_error_code: errorCode,
    last_error_message: errorMessage,
    updated_at: new Date().toISOString(),
  };

  if (status === "failed") {
    updatePayload.failure_code = errorCode;
    updatePayload.failure_message = errorMessage;
    updatePayload.status = "failed";
  }

  if (providerSnapshot) {
    updatePayload.provider_snapshot = providerSnapshot;
  }

  await admin
    .from("cash_charge_orders")
    .update(updatePayload)
    .eq("id", chargeOrderId);
}

export async function clearChargeOrderErrors(admin: any, chargeOrderId: string) {
  await admin
    .from("cash_charge_orders")
    .update({
      failure_code: null,
      failure_message: null,
      last_error_code: null,
      last_error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chargeOrderId);
}

export async function transitionPendingChargeOrderStatus(
  admin: any,
  chargeOrder: ChargeOrderLookup,
  {
    errorCode,
    errorMessage,
    providerSnapshot,
    status,
  }: {
    errorCode: string;
    errorMessage: string;
    providerSnapshot?: Record<string, unknown> | null;
    status: "cancelled" | "expired" | "failed";
  },
) {
  if (chargeOrder.status !== "pending") {
    return false;
  }

  const updatePayload: Record<string, unknown> = {
    failure_code: errorCode,
    failure_message: errorMessage,
    last_error_code: errorCode,
    last_error_message: errorMessage,
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "cancelled") {
    updatePayload.cancel_reason = errorMessage;
  }

  if (providerSnapshot) {
    updatePayload.provider_snapshot = providerSnapshot;
  }

  await admin
    .from("cash_charge_orders")
    .update(updatePayload)
    .eq("id", chargeOrder.id)
    .eq("status", "pending");

  return true;
}

export function getWebhookPaymentKey(payload: Record<string, unknown> | null) {
  const data = getWebhookData(payload);

  return typeof data?.paymentKey === "string" && data.paymentKey.trim()
    ? data.paymentKey.trim()
    : null;
}

export function getWebhookPaymentStatus(payload: Record<string, unknown> | null) {
  const data = getWebhookData(payload);

  return typeof data?.status === "string" && data.status.trim()
    ? data.status.trim()
    : null;
}

async function applyApprovedChargeOrder(
  admin: any,
  {
    chargeOrder,
    method,
    orderId,
    paymentKey,
    providerSnapshot,
    source,
  }: {
    chargeOrder: ChargeOrderLookup;
    method: string | null;
    orderId: string;
    paymentKey: string;
    providerSnapshot: Record<string, unknown>;
    source: TossChargeSuccessResult["source"];
  },
): Promise<TossChargeResult> {
  const { data, error } = await admin.rpc("approve_cash_charge_order", {
    p_order_id: orderId,
    p_provider_snapshot: providerSnapshot,
    p_toss_payment_key: paymentKey,
  });

  if (error) {
    await markChargeOrderError(admin, chargeOrder.id, {
      errorCode: "CASH_LEDGER_APPLY_FAILED",
      errorMessage: error.message,
      providerSnapshot,
      status: null,
    });

    return buildFailureResult(orderId, {
      code: "CASH_LEDGER_APPLY_FAILED",
      httpStatus: 500,
      message: "결제 승인은 완료됐지만 캐시 적립 반영에 실패했습니다.",
      retryable: true,
      status: "pending",
    });
  }

  await clearChargeOrderErrors(admin, chargeOrder.id);

  const approvedPayload = (data ?? {}) as Record<string, unknown>;
  const remainingCash = getRemainingCash(approvedPayload);

  await sendCashChargedNotification({
    amount: chargeOrder.amount,
    chargeOrderId: chargeOrder.id,
    orderId,
    remainingCash,
    userId: chargeOrder.user_id,
  });

  return {
    chargedAmount: chargeOrder.amount,
    method,
    ok: true,
    orderId,
    remainingCash,
    retryable: false,
    source,
    status: "paid",
  };
}

async function buildAlreadyPaidResult(
  admin: any,
  chargeOrder: ChargeOrderLookup,
  paymentKey: string | null,
): Promise<TossChargeResult> {
  if (
    paymentKey &&
    chargeOrder.toss_payment_key &&
    chargeOrder.toss_payment_key !== paymentKey
  ) {
    return buildFailureResult(chargeOrder.order_id, {
      code: "ORDER_ALREADY_PAID",
      httpStatus: 409,
      message: "이미 다른 결제 키로 완료된 주문입니다.",
      status: "paid",
    });
  }

  const remainingCash = await getChargeOrderBalance(admin, chargeOrder.user_id);

  return {
    chargedAmount: chargeOrder.amount,
    method: null,
    ok: true,
    orderId: chargeOrder.order_id,
    remainingCash,
    retryable: false,
    source: "already_paid",
    status: "paid",
  };
}

async function getChargeOrderBalance(admin: any, userId: string) {
  const { data } = await admin
    .from("cash_accounts")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  return ((data ?? null) as ChargeOrderBalanceLookup | null)?.balance ?? 0;
}

function buildFailureResult(
  orderId: string,
  {
    code,
    httpStatus,
    message,
    retryable = false,
    status,
  }: {
    code: string;
    httpStatus: number;
    message: string;
    retryable?: boolean;
    status?: ChargeOrderStatus;
  },
): TossChargeFailureResult {
  return {
    code,
    httpStatus,
    message,
    ok: false,
    orderId,
    retryable,
    status,
  };
}

function getRemainingCash(payload: Record<string, unknown>) {
  return typeof payload.remainingCash === "number" ? payload.remainingCash : 0;
}

function getWebhookData(payload: Record<string, unknown> | null) {
  if (!payload) {
    return null;
  }

  const data = payload.data;
  return typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)
    : null;
}
