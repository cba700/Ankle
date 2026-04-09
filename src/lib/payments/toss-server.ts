import "server-only";

import { getTossPaymentsServerEnv } from "@/lib/supabase/env";

type TossConfirmParams = {
  amount: number;
  orderId: string;
  paymentKey: string;
};

type TossPaymentSummary = {
  method?: string | null;
  orderId?: string | null;
  paymentKey?: string | null;
  status?: string | null;
  totalAmount?: number | null;
};

type ValidatedTossPayment =
  | {
      code: string;
      message: string;
      ok: false;
    }
  | {
      method: string | null;
      ok: true;
      payload: Record<string, unknown>;
    };

export async function confirmTossPayment({
  amount,
  orderId,
  paymentKey,
}: TossConfirmParams) {
  const env = getTossPaymentsServerEnv();

  if (!env) {
    throw new Error("TOSS_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: buildTossAuthorizationHeader(env.secretKey),
      "Content-Type": "application/json",
      "Idempotency-Key": `ankle-confirm-${orderId}`,
    },
    body: JSON.stringify({
      amount,
      orderId,
      paymentKey,
    }),
    cache: "no-store",
  });

  return {
    ok: response.ok,
    payload: (await response.json().catch(() => null)) as Record<string, unknown> | null,
    status: response.status,
  };
}

export async function getTossPayment(paymentKey: string) {
  const env = getTossPaymentsServerEnv();

  if (!env) {
    throw new Error("TOSS_NOT_CONFIGURED");
  }

  const response = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
    {
      method: "GET",
      headers: {
        Authorization: buildTossAuthorizationHeader(env.secretKey),
      },
      cache: "no-store",
    },
  );

  return {
    ok: response.ok,
    payload: (await response.json().catch(() => null)) as Record<string, unknown> | null,
    status: response.status,
  };
}

export function summarizeTossPayment(
  payload: Record<string, unknown> | null,
): TossPaymentSummary {
  if (!payload) {
    return {};
  }

  return {
    method: typeof payload.method === "string" ? payload.method : null,
    orderId: typeof payload.orderId === "string" ? payload.orderId : null,
    paymentKey: typeof payload.paymentKey === "string" ? payload.paymentKey : null,
    status: typeof payload.status === "string" ? payload.status : null,
    totalAmount:
      typeof payload.totalAmount === "number" ? payload.totalAmount : null,
  };
}

export function validateConfirmedTossPayment(
  payload: Record<string, unknown> | null,
  {
    amount,
    orderId,
    paymentKey,
  }: TossConfirmParams,
): ValidatedTossPayment {
  if (!payload) {
    return {
      code: "TOSS_RESPONSE_INVALID",
      message: "토스 승인 응답을 해석할 수 없습니다.",
      ok: false,
    };
  }

  const summary = summarizeTossPayment(payload);

  if (summary.status !== "DONE") {
    return {
      code: "TOSS_CONFIRM_INVALID_STATUS",
      message: "결제 승인 상태가 완료가 아닙니다.",
      ok: false,
    };
  }

  if (summary.orderId !== orderId) {
    return {
      code: "TOSS_CONFIRM_ORDER_MISMATCH",
      message: "토스 승인 응답 주문번호가 원장 주문과 일치하지 않습니다.",
      ok: false,
    };
  }

  if (summary.paymentKey !== paymentKey) {
    return {
      code: "TOSS_CONFIRM_PAYMENT_KEY_MISMATCH",
      message: "토스 승인 응답 결제 키가 요청값과 일치하지 않습니다.",
      ok: false,
    };
  }

  if (summary.totalAmount !== amount) {
    return {
      code: "TOSS_CONFIRM_AMOUNT_MISMATCH",
      message: "토스 승인 응답 금액이 원장 금액과 일치하지 않습니다.",
      ok: false,
    };
  }

  return {
    method: summary.method ?? null,
    ok: true,
    payload,
  };
}

export function getTossErrorMessage(payload: Record<string, unknown> | null) {
  if (!payload) {
    return "토스 승인 응답을 해석할 수 없습니다.";
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if (typeof payload.code === "string" && payload.code.trim()) {
    return payload.code;
  }

  return "토스 결제 승인에 실패했습니다.";
}

export function getTossErrorCode(payload: Record<string, unknown> | null) {
  if (!payload) {
    return "TOSS_RESPONSE_INVALID";
  }

  return typeof payload.code === "string" && payload.code.trim()
    ? payload.code
    : "TOSS_CONFIRM_FAILED";
}

function buildTossAuthorizationHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}
