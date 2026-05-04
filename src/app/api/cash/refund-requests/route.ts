import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { processOriginalPaymentCashRefund } from "@/lib/payments/cash-refund";
import { assertCashRefundRequestSchemaReady } from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type SubmitCashRefundRequestBody = {
  agreedToPolicy?: unknown;
  agreedToSchedule?: unknown;
};

export async function POST(request: Request) {
  if (!isAllowedSameOriginRequest(request)) {
    return NextResponse.json(
      { code: "ORIGIN_MISMATCH", message: "잘못된 요청입니다." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 403 },
    );
  }

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

  const body = (await request.json().catch(() => null)) as SubmitCashRefundRequestBody | null;
  const agreedToPolicy =
    body?.agreedToPolicy === true || body?.agreedToSchedule === true;

  if (!agreedToPolicy) {
    return NextResponse.json(
      {
        code: "REFUND_SCHEDULE_CONFIRM_REQUIRED",
        message: "환불 처리 안내에 동의해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    return NextResponse.json(
      {
        code: "SERVICE_ROLE_NOT_CONFIGURED",
        message: "환불 처리를 위한 서버 설정이 완료되지 않았습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  await assertCashRefundRequestSchemaReady(supabase);

  const { data, error } = await supabase.rpc("submit_cash_refund_request");

  if (error) {
    const mappedError = mapRefundRequestError(error.message);

    return NextResponse.json(
      mappedError.body,
      { headers: PRIVATE_NO_STORE_HEADERS, status: mappedError.status },
    );
  }

  const payload = (data ?? {}) as {
    requestId?: unknown;
    requestedAmount?: unknown;
  };
  const refundRequestId =
    typeof payload.requestId === "string" ? payload.requestId : "";
  const requestedAmount =
    typeof payload.requestedAmount === "number"
      ? payload.requestedAmount
      : Number(payload.requestedAmount);

  if (!refundRequestId || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return NextResponse.json(
      {
        code: "CASH_REFUND_REQUEST_INVALID",
        message: "환불 요청 정보를 확인하지 못했습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
    );
  }

  const refundResult = await processOriginalPaymentCashRefund(admin, {
    refundRequestId,
    requestedAmount,
    userId: user.id,
  });

  return NextResponse.json(
    {
      ...(data ?? {}),
      code: refundResult.code,
      message: refundResult.message,
      ok: refundResult.ok,
      refundedAmount: refundResult.refundedAmount,
      requestedAmount: refundResult.requestedAmount,
    },
    {
      headers: PRIVATE_NO_STORE_HEADERS,
      status: refundResult.ok ? 200 : refundResult.httpStatus ?? 502,
    },
  );
}

function isAllowedSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const requestOrigin = new URL(request.url).origin;

  if (origin && origin !== requestOrigin) {
    return false;
  }

  if (!origin && fetchSite === "cross-site") {
    return false;
  }

  return true;
}

function mapRefundRequestError(message: string) {
  switch (message) {
    case "PENDING_REFUND_REQUEST_EXISTS":
      return {
        body: {
          code: "PENDING_REFUND_REQUEST_EXISTS",
          message: "이미 진행 중인 환불 신청이 있습니다.",
        },
        status: 409,
      };
    case "NO_REFUNDABLE_CASH":
      return {
        body: {
          code: "NO_REFUNDABLE_CASH",
          message: "충전 시 사용한 결제수단으로 환불 가능한 캐시가 없습니다.",
        },
        status: 400,
      };
    case "AUTH_REQUIRED":
      return {
        body: {
          code: "AUTH_REQUIRED",
          message: "로그인이 필요한 기능입니다.",
        },
        status: 401,
      };
    default:
      return {
        body: {
          code: "CASH_REFUND_REQUEST_FAILED",
          message: "환불 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        status: 400,
      };
  }
}
