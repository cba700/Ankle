import { NextResponse } from "next/server";
import {
  isCashRefundBankName,
  isValidCashRefundAccountHolder,
  isValidCashRefundAccountNumber,
  normalizeCashRefundAccountHolder,
  normalizeCashRefundAccountNumber,
} from "@/lib/cash-refunds";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { assertCashRefundRequestSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SubmitCashRefundRequestBody = {
  accountHolder?: unknown;
  accountNumber?: unknown;
  agreedToSchedule?: unknown;
  bankName?: unknown;
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
  const bankName =
    typeof body?.bankName === "string" ? body.bankName.trim() : "";
  const accountNumber = normalizeCashRefundAccountNumber(
    typeof body?.accountNumber === "string" ? body.accountNumber : "",
  );
  const accountHolder = normalizeCashRefundAccountHolder(
    typeof body?.accountHolder === "string" ? body.accountHolder : "",
  );
  const agreedToSchedule = body?.agreedToSchedule === true;

  if (!agreedToSchedule) {
    return NextResponse.json(
      {
        code: "REFUND_SCHEDULE_CONFIRM_REQUIRED",
        message: "환불 처리 안내에 동의해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!isCashRefundBankName(bankName)) {
    return NextResponse.json(
      { code: "INVALID_BANK_NAME", message: "은행을 선택해 주세요." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!isValidCashRefundAccountNumber(accountNumber)) {
    return NextResponse.json(
      {
        code: "INVALID_ACCOUNT_NUMBER",
        message: "계좌번호를 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!isValidCashRefundAccountHolder(accountHolder)) {
    return NextResponse.json(
      {
        code: "INVALID_ACCOUNT_HOLDER",
        message: "예금주명을 입력해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  await assertCashRefundRequestSchemaReady(supabase);

  const { data, error } = await supabase.rpc("submit_cash_refund_request", {
    p_account_holder: accountHolder,
    p_account_number: accountNumber,
    p_bank_name: bankName,
  });

  if (error) {
    const mappedError = mapRefundRequestError(error.message);

    return NextResponse.json(
      mappedError.body,
      { headers: PRIVATE_NO_STORE_HEADERS, status: mappedError.status },
    );
  }

  return NextResponse.json(
    { ...(data ?? {}), ok: true },
    { headers: PRIVATE_NO_STORE_HEADERS },
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
          message: "이미 처리 대기 중인 환불 신청이 있습니다.",
        },
        status: 409,
      };
    case "NO_REFUNDABLE_CASH":
      return {
        body: {
          code: "NO_REFUNDABLE_CASH",
          message: "현재 환불 신청 가능한 캐시가 없습니다.",
        },
        status: 400,
      };
    case "INVALID_BANK_NAME":
      return {
        body: {
          code: "INVALID_BANK_NAME",
          message: "은행을 다시 선택해 주세요.",
        },
        status: 400,
      };
    case "INVALID_ACCOUNT_NUMBER":
      return {
        body: {
          code: "INVALID_ACCOUNT_NUMBER",
          message: "계좌번호를 다시 확인해 주세요.",
        },
        status: 400,
      };
    case "INVALID_ACCOUNT_HOLDER":
      return {
        body: {
          code: "INVALID_ACCOUNT_HOLDER",
          message: "예금주명을 다시 확인해 주세요.",
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
