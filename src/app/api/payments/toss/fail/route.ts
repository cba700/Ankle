import { NextResponse } from "next/server";
import { assertCashChargeOperationsSchemaReady } from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type FailBody = {
  code?: unknown;
  message?: unknown;
  orderId?: unknown;
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
    return NextResponse.json({ ok: true });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json().catch(() => null)) as FailBody | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

  if (!orderId) {
    return NextResponse.json({ ok: true });
  }

  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json({ ok: true });
  }

  const { data: order } = await admin
    .from("cash_charge_orders")
    .select("id, order_id, user_id, status")
    .eq("order_id", orderId)
    .maybeSingle();

  const typedOrder = order as ChargeOrderLookup | null;

  if (!typedOrder || typedOrder.user_id !== user.id || typedOrder.status !== "pending") {
    return NextResponse.json({ ok: true });
  }

  const errorCode =
    typeof body?.code === "string" && body.code.trim()
      ? body.code.trim()
      : "PAYMENT_FAILED";
  const errorMessage =
    typeof body?.message === "string" && body.message.trim()
      ? body.message.trim()
      : "결제 요청이 완료되지 않았습니다.";

  await admin
    .from("cash_charge_orders")
    .update({
      failure_code: errorCode,
      failure_message: errorMessage,
      last_error_code: errorCode,
      last_error_message: errorMessage,
      status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", typedOrder.id);

  return NextResponse.json({ ok: true });
}
