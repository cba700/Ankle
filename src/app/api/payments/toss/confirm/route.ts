import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { finalizeTossChargeOrder } from "@/lib/payments/toss-charge";
import { assertCashChargeOperationsSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type ConfirmBody = {
  amount?: unknown;
  orderId?: unknown;
  paymentKey?: unknown;
};

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "로그인이 필요한 기능입니다." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 401 },
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
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json(
      { code: "SERVICE_ROLE_NOT_CONFIGURED", message: "서버 결제 권한이 설정되지 않았습니다." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  const result = await finalizeTossChargeOrder(admin, {
    amount,
    expectedUserId: user.id,
    orderId,
    paymentKey,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        code: result.code,
        message: result.message,
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: result.httpStatus },
    );
  }

  return NextResponse.json({
    chargedAmount: result.chargedAmount,
    method: result.method,
    ok: true,
    orderId: result.orderId,
    remainingCash: result.remainingCash,
    status: result.status,
  }, {
    headers: PRIVATE_NO_STORE_HEADERS,
  });
}
