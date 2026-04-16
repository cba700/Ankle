import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { assertCashChargeOperationsSchemaReady } from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type FailBody = {
  code?: unknown;
  message?: unknown;
  orderId?: unknown;
  rawMessage?: unknown;
  source?: unknown;
};

type ChargeOrderLookup = {
  id: string;
  order_id: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  user_id: string;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as FailBody | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const { data: order } = await admin
    .from("cash_charge_orders")
    .select("id, order_id, user_id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  const typedOrder = order as ChargeOrderLookup | null;

  if (!typedOrder || typedOrder.user_id !== user.id || typedOrder.status !== "pending") {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const errorCode =
    typeof body?.code === "string" && body.code.trim()
      ? body.code.trim()
      : "PAYMENT_FAILED";
  const errorMessage = getFailureMessage(errorCode);
  const rawErrorMessage = getRawFailureMessage(body);
  const source =
    body?.source === "sdk_launch" || body?.source === "redirect_fail"
      ? body.source
      : "redirect_fail";
  const nextStatus = errorCode === "PAY_PROCESS_CANCELED" ? "cancelled" : "failed";

  if (nextStatus === "failed") {
    console.error("Cash charge flow failed before confirmation", {
      code: errorCode,
      orderId: typedOrder.order_id,
      rawMessage: rawErrorMessage,
      source,
      userId: user.id,
    });
  }

  await admin
    .from("cash_charge_orders")
    .update({
      cancel_reason: nextStatus === "cancelled" ? "user_cancelled" : null,
      failure_code: errorCode,
      failure_message: errorMessage,
      last_error_code: errorCode,
      last_error_message: errorMessage,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", typedOrder.id);

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}

function getFailureMessage(code: string) {
  switch (code) {
    case "PAY_PROCESS_CANCELED":
      return "결제가 취소되었습니다.";
    case "PAYMENT_WINDOW_OPEN_FAILED":
      return "결제 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return "결제 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

function getRawFailureMessage(body: FailBody | null) {
  if (typeof body?.rawMessage === "string" && body.rawMessage.trim()) {
    return body.rawMessage.trim();
  }

  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  return null;
}
