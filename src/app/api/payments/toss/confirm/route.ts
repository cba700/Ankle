import { NextResponse } from "next/server";
import {
  confirmTossPayment,
  getTossErrorCode,
  getTossErrorMessage,
  summarizeTossPayment,
} from "@/lib/payments/toss-server";
import { assertCashChargeOperationsSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type ConfirmBody = {
  amount?: unknown;
  orderId?: unknown;
  paymentKey?: unknown;
};

type ChargeOrderRow = {
  amount: number;
  id: string;
  order_id: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  toss_payment_key: string | null;
  user_id: string;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "로그인이 필요한 기능입니다." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as ConfirmBody | null;
  const amount = typeof body?.amount === "number" ? body.amount : Number.NaN;
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
  const paymentKey =
    typeof body?.paymentKey === "string" ? body.paymentKey.trim() : "";

  if (!Number.isInteger(amount) || amount <= 0 || !orderId || !paymentKey) {
    return NextResponse.json(
      { code: "INVALID_CONFIRM_REQUEST", message: "결제 승인 요청값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json(
      { code: "SERVICE_ROLE_NOT_CONFIGURED", message: "서버 결제 권한이 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const { data: order, error: orderError } = await admin
    .from("cash_charge_orders")
    .select("id, user_id, order_id, amount, status, toss_payment_key")
    .eq("order_id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { code: "CHARGE_ORDER_LOOKUP_FAILED", message: orderError.message },
      { status: 500 },
    );
  }

  const typedOrder = order as ChargeOrderRow | null;

  if (!typedOrder) {
    return NextResponse.json(
      { code: "CHARGE_ORDER_NOT_FOUND", message: "충전 주문을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  if (typedOrder.user_id !== user.id) {
    return NextResponse.json(
      { code: "FORBIDDEN_ORDER_ACCESS", message: "다른 사용자의 주문에는 접근할 수 없습니다." },
      { status: 403 },
    );
  }

  if (typedOrder.amount !== amount) {
    await markChargeOrderError(admin, typedOrder.id, {
      errorCode: "AMOUNT_MISMATCH",
      errorMessage: "결제 인증 금액이 주문 원장 금액과 일치하지 않습니다.",
      status: "failed",
    });

    return NextResponse.json(
      {
        code: "AMOUNT_MISMATCH",
        message: "결제 인증 금액이 주문 금액과 일치하지 않습니다.",
      },
      { status: 400 },
    );
  }

  if (typedOrder.status === "paid") {
    if (
      typedOrder.toss_payment_key &&
      typedOrder.toss_payment_key !== paymentKey
    ) {
      return NextResponse.json(
        {
          code: "ORDER_ALREADY_PAID",
          message: "이미 다른 결제 키로 완료된 주문입니다.",
        },
        { status: 409 },
      );
    }

    const { data: cashAccount } = await admin
      .from("cash_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    const typedCashAccount = cashAccount as { balance: number } | null;

    return NextResponse.json({
      chargedAmount: typedOrder.amount,
      ok: true,
      orderId: typedOrder.order_id,
      remainingCash: typedCashAccount?.balance ?? 0,
      status: "paid",
    });
  }

  if (typedOrder.status !== "pending") {
    return NextResponse.json(
      {
        code: "ORDER_NOT_PENDING",
        message: "대기 중인 주문만 승인할 수 있습니다.",
      },
      { status: 409 },
    );
  }

  try {
    const confirmResult = await confirmTossPayment({
      amount,
      orderId,
      paymentKey,
    });

    if (!confirmResult.ok) {
      const errorCode = getTossErrorCode(confirmResult.payload);
      const errorMessage = getTossErrorMessage(confirmResult.payload);

      await markChargeOrderError(admin, typedOrder.id, {
        errorCode,
        errorMessage,
        providerSnapshot: confirmResult.payload,
        status: confirmResult.status >= 500 ? null : "failed",
      });

      return NextResponse.json(
        {
          code: errorCode,
          message: errorMessage,
        },
        { status: confirmResult.status >= 500 ? 502 : 400 },
      );
    }

    const summary = summarizeTossPayment(confirmResult.payload);
    const { data, error } = await admin.rpc("approve_cash_charge_order", {
      p_order_id: orderId,
      p_provider_snapshot: confirmResult.payload ?? {},
      p_toss_payment_key: paymentKey,
    });

    if (error) {
      await markChargeOrderError(admin, typedOrder.id, {
        errorCode: "CASH_LEDGER_APPLY_FAILED",
        errorMessage: error.message,
        providerSnapshot: confirmResult.payload,
        status: null,
      });

      return NextResponse.json(
        {
          code: "CASH_LEDGER_APPLY_FAILED",
          message: "결제 승인은 완료됐지만 캐시 적립 반영에 실패했습니다.",
        },
        { status: 500 },
      );
    }

    await admin
      .from("cash_charge_orders")
      .update({
        failure_code: null,
        failure_message: null,
        last_error_code: null,
        last_error_message: null,
      })
      .eq("id", typedOrder.id);

    const approvedPayload = (data ?? {}) as Record<string, unknown>;

    return NextResponse.json({
      ...approvedPayload,
      chargedAmount: typedOrder.amount,
      method: summary.method ?? null,
      ok: true,
      orderId,
    });
  } catch (error) {
    await markChargeOrderError(admin, typedOrder.id, {
      errorCode: "TOSS_CONFIRM_REQUEST_FAILED",
      errorMessage:
        error instanceof Error
          ? error.message
          : "토스 승인 API 호출 중 알 수 없는 오류가 발생했습니다.",
      status: null,
    });

    return NextResponse.json(
      {
        code: "TOSS_CONFIRM_REQUEST_FAILED",
        message: "토스 승인 서버와 통신하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 502 },
    );
  }
}

async function markChargeOrderError(
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
    status: "failed" | null;
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
