import "server-only";

import {
  cancelTossPayment,
  getTossErrorCode,
  getTossErrorMessage,
} from "./toss-server";

type RefundCandidate = {
  amount: number;
  id: string;
  order_id: string;
  refunded_amount: number | null;
  toss_payment_key: string | null;
};

type ProcessOriginalPaymentCashRefundParams = {
  refundRequestId: string;
  requestedAmount: number;
  userId: string;
};

type ProcessOriginalPaymentCashRefundResult = {
  code?: string;
  httpStatus?: number;
  message: string;
  ok: boolean;
  refundedAmount: number;
  requestedAmount: number;
};

export async function processOriginalPaymentCashRefund(
  admin: any,
  {
    refundRequestId,
    requestedAmount,
    userId,
  }: ProcessOriginalPaymentCashRefundParams,
): Promise<ProcessOriginalPaymentCashRefundResult> {
  let refundedAmount = 0;

  try {
    const candidates = await listRefundCandidates(admin, userId);
    let remainingAmount = requestedAmount;

    for (const candidate of candidates) {
      if (remainingAmount <= 0) {
        break;
      }

      const refundableAmount = Math.max(
        candidate.amount - (candidate.refunded_amount ?? 0),
        0,
      );

      if (refundableAmount <= 0 || !candidate.toss_payment_key) {
        continue;
      }

      const cancelAmount = Math.min(remainingAmount, refundableAmount);
      const idempotencyKey = `ankle-cash-refund-${refundRequestId}-${candidate.id}`;
      const cancelResult = await cancelTossPayment({
        cancelAmount,
        cancelReason: "캐시 환불",
        idempotencyKey,
        paymentKey: candidate.toss_payment_key,
      });

      if (!cancelResult.ok) {
        const errorCode = getTossErrorCode(cancelResult.payload);
        const errorMessage = getTossErrorMessage(cancelResult.payload);

        await recordRefundCancellation(admin, {
          cancelAmount,
          chargeOrderId: candidate.id,
          failureCode: errorCode,
          failureMessage: errorMessage,
          idempotencyKey,
          paymentKey: candidate.toss_payment_key,
          providerSnapshot: cancelResult.payload,
          refundRequestId,
          status: "failed",
        });

        return completeRefundRequest(admin, {
          code: errorCode,
          httpStatus: cancelResult.status >= 500 ? 502 : 400,
          message: errorMessage,
          processedAmount: refundedAmount,
          refundRequestId,
          requestedAmount,
        });
      }

      refundedAmount += cancelAmount;
      remainingAmount -= cancelAmount;

      await recordRefundCancellation(admin, {
        cancelAmount,
        chargeOrderId: candidate.id,
        idempotencyKey,
        paymentKey: candidate.toss_payment_key,
        providerSnapshot: cancelResult.payload,
        refundRequestId,
        status: "succeeded",
      });
    }

    return completeRefundRequest(admin, {
      code: refundedAmount >= requestedAmount ? undefined : "REFUND_PARTIALLY_PROCESSED",
      httpStatus: refundedAmount > 0 ? undefined : 409,
      message:
        refundedAmount >= requestedAmount
          ? "환불이 결제했던 수단으로 접수되었습니다."
          : "환불 가능한 결제 내역을 모두 처리하지 못했습니다.",
      processedAmount: refundedAmount,
      refundRequestId,
      requestedAmount,
    });
  } catch (error) {
    return completeRefundRequest(admin, {
      code: "ORIGINAL_PAYMENT_REFUND_FAILED",
      httpStatus: 502,
      message:
        error instanceof Error
          ? error.message
          : "결제수단 환불 처리 중 오류가 발생했습니다.",
      processedAmount: refundedAmount,
      refundRequestId,
      requestedAmount,
    });
  }
}

async function listRefundCandidates(admin: any, userId: string) {
  const { data, error } = await admin
    .from("cash_charge_orders")
    .select("id, order_id, amount, refunded_amount, toss_payment_key")
    .eq("user_id", userId)
    .eq("status", "paid")
    .not("toss_payment_key", "is", null)
    .order("approved_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load refundable charge orders: ${error.message}`);
  }

  return (data ?? []) as RefundCandidate[];
}

async function recordRefundCancellation(
  admin: any,
  {
    cancelAmount,
    chargeOrderId,
    failureCode,
    failureMessage,
    idempotencyKey,
    paymentKey,
    providerSnapshot,
    refundRequestId,
    status,
  }: {
    cancelAmount: number;
    chargeOrderId: string;
    failureCode?: string;
    failureMessage?: string;
    idempotencyKey: string;
    paymentKey: string;
    providerSnapshot: Record<string, unknown> | null;
    refundRequestId: string;
    status: "failed" | "succeeded";
  },
) {
  const { error } = await admin.rpc("record_cash_refund_cancellation_result", {
    p_cancel_amount: cancelAmount,
    p_charge_order_id: chargeOrderId,
    p_failure_code: failureCode ?? null,
    p_failure_message: failureMessage ?? null,
    p_idempotency_key: idempotencyKey,
    p_payment_key: paymentKey,
    p_provider_snapshot: providerSnapshot ?? {},
    p_refund_request_id: refundRequestId,
    p_status: status,
  });

  if (error) {
    throw new Error(`Failed to record refund cancellation: ${error.message}`);
  }
}

async function completeRefundRequest(
  admin: any,
  {
    code,
    httpStatus,
    message,
    processedAmount,
    refundRequestId,
    requestedAmount,
  }: {
    code?: string;
    httpStatus?: number;
    message: string;
    processedAmount: number;
    refundRequestId: string;
    requestedAmount: number;
  },
): Promise<ProcessOriginalPaymentCashRefundResult> {
  const { error } = await admin.rpc("complete_cash_refund_request", {
    p_note: message,
    p_processed_amount: processedAmount,
    p_request_id: refundRequestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    code,
    httpStatus,
    message,
    ok: processedAmount > 0,
    refundedAmount: processedAmount,
    requestedAmount,
  };
}
