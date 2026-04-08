import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { buildCashChargeOrderId, buildCashChargeOrderName, isCashChargePackage } from "@/lib/payments/toss";
import { assertCashChargeOperationsSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isTossPaymentsConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (!isTossPaymentsConfigured()) {
    return NextResponse.json(
      { code: "TOSS_NOT_CONFIGURED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: unknown;
  } | null;

  if (!body || !isCashChargePackage(body.amount)) {
    return NextResponse.json(
      { code: "INVALID_CHARGE_AMOUNT" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  await assertCashChargeOperationsSchemaReady(supabase);

  const orderId = buildCashChargeOrderId();
  const { data, error } = await supabase.rpc("create_cash_charge_order", {
    p_amount: body.amount,
    p_order_id: orderId,
  });

  if (error) {
    return NextResponse.json(
      { code: error.message || "CHARGE_ORDER_CREATE_FAILED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  return NextResponse.json({
    ...(data ?? {}),
    ok: true,
    orderId,
    orderName: buildCashChargeOrderName(body.amount),
  }, {
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
