import { NextResponse } from "next/server";
import { clearSingleSessionCookie } from "@/lib/auth/single-session";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  isCashRefundBankName,
  isValidCashRefundAccountHolder,
  isValidCashRefundAccountNumber,
  normalizeCashRefundAccountHolder,
  normalizeCashRefundAccountNumber,
} from "@/lib/cash-refunds";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertAccountWithdrawalSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AccountWithdrawalBody = {
  accountHolder?: unknown;
  accountNumber?: unknown;
  agreedToWarnings?: unknown;
  bankName?: unknown;
};

type AccountWithdrawalRpcResult = {
  blockedUntil?: string | null;
  refundRequestId?: string | null;
  requestedAmount?: number;
  status?: "withdrawal_pending" | "withdrawn";
  withdrawalRequestId?: string;
};

export async function POST(request: Request) {
  const { accountStatus, configured, user } = await getServerUserState();

  if (!configured) {
    return NextResponse.json(
      {
        code: "SUPABASE_NOT_CONFIGURED",
        message: "Supabase가 설정되지 않았습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  if (!user) {
    return NextResponse.json(
      {
        code: "AUTH_REQUIRED",
        message: "로그인이 필요한 기능입니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 401 },
    );
  }

  if (accountStatus !== "active") {
    return NextResponse.json(
      {
        code:
          accountStatus === "withdrawn"
            ? "ACCOUNT_WITHDRAWN"
            : "ACCOUNT_WITHDRAWAL_PENDING",
        message:
          accountStatus === "withdrawn"
            ? "탈퇴 처리된 계정입니다. 30일 이후 다시 로그인해 주세요."
            : "이미 회원 탈퇴 처리 중인 계정입니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 403 },
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        code: "SUPABASE_NOT_CONFIGURED",
        message: "Supabase가 설정되지 않았습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  await assertAccountWithdrawalSchemaReady(supabase);

  const body = (await request.json().catch(() => null)) as AccountWithdrawalBody | null;
  const agreedToWarnings = body?.agreedToWarnings === true;
  const bankName = typeof body?.bankName === "string" ? body.bankName.trim() : "";
  const accountNumber = normalizeCashRefundAccountNumber(
    typeof body?.accountNumber === "string" ? body.accountNumber : "",
  );
  const accountHolder = normalizeCashRefundAccountHolder(
    typeof body?.accountHolder === "string" ? body.accountHolder : "",
  );

  if (!agreedToWarnings) {
    return NextResponse.json(
      {
        code: "WITHDRAWAL_CONFIRMATION_REQUIRED",
        message: "탈퇴 전 안내사항을 확인하고 동의해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (bankName && !isCashRefundBankName(bankName)) {
    return NextResponse.json(
      {
        code: "INVALID_BANK_NAME",
        message: "환불 은행을 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (accountNumber && !isValidCashRefundAccountNumber(accountNumber)) {
    return NextResponse.json(
      {
        code: "INVALID_ACCOUNT_NUMBER",
        message: "환불 계좌번호를 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (accountHolder && !isValidCashRefundAccountHolder(accountHolder)) {
    return NextResponse.json(
      {
        code: "INVALID_ACCOUNT_HOLDER",
        message: "예금주명을 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("begin_account_withdrawal", {
    p_account_holder: accountHolder || null,
    p_account_number: accountNumber || null,
    p_bank_name: bankName || null,
  });

  if (error) {
    return NextResponse.json(
      mapAccountWithdrawalError(error.message),
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: getAccountWithdrawalErrorStatus(error.message),
      },
    );
  }

  await supabase.auth.signOut();

  const result = (data ?? {}) as AccountWithdrawalRpcResult;

  const response = NextResponse.json(
    {
      blockedUntil: result.blockedUntil ?? null,
      ok: true,
      refundRequestId: result.refundRequestId ?? null,
      requestedAmount: result.requestedAmount ?? 0,
      status: result.status ?? "withdrawal_pending",
      withdrawalRequestId: result.withdrawalRequestId ?? null,
    },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );

  clearSingleSessionCookie(response);

  return response;
}

function mapAccountWithdrawalError(message: string) {
  const normalizedMessage = message.toUpperCase();

  if (normalizedMessage.includes("ACCOUNT_WITHDRAWAL_ALREADY_PENDING")) {
    return {
      code: "ACCOUNT_WITHDRAWAL_ALREADY_PENDING",
      message: "이미 회원 탈퇴 처리 중입니다.",
    };
  }

  if (normalizedMessage.includes("UPCOMING_MATCH_APPLICATIONS_EXIST")) {
    return {
      code: "UPCOMING_MATCH_APPLICATIONS_EXIST",
      message: "예정된 매치를 모두 취소한 뒤 회원 탈퇴를 진행해 주세요.",
    };
  }

  if (normalizedMessage.includes("PENDING_CHARGE_ORDER_EXISTS")) {
    return {
      code: "PENDING_CHARGE_ORDER_EXISTS",
      message: "미완료 충전 주문이 있어 회원 탈퇴를 진행할 수 없습니다.",
    };
  }

  if (normalizedMessage.includes("PENDING_REFUND_REQUEST_EXISTS")) {
    return {
      code: "PENDING_REFUND_REQUEST_EXISTS",
      message: "이미 접수된 환불 요청을 확인한 뒤 다시 시도해 주세요.",
    };
  }

  if (normalizedMessage.includes("INVALID_BANK_NAME")) {
    return {
      code: "INVALID_BANK_NAME",
      message: "환불 은행을 다시 확인해 주세요.",
    };
  }

  if (normalizedMessage.includes("INVALID_ACCOUNT_NUMBER")) {
    return {
      code: "INVALID_ACCOUNT_NUMBER",
      message: "환불 계좌번호를 다시 확인해 주세요.",
    };
  }

  if (normalizedMessage.includes("INVALID_ACCOUNT_HOLDER")) {
    return {
      code: "INVALID_ACCOUNT_HOLDER",
      message: "예금주명을 다시 확인해 주세요.",
    };
  }

  if (normalizedMessage.includes("ACCOUNT_NOT_ACTIVE")) {
    return {
      code: "ACCOUNT_NOT_ACTIVE",
      message: "현재 계정 상태에서는 회원 탈퇴를 진행할 수 없습니다.",
    };
  }

  return {
    code: "ACCOUNT_WITHDRAWAL_REQUEST_FAILED",
    message: "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  };
}

function getAccountWithdrawalErrorStatus(message: string) {
  const normalizedMessage = message.toUpperCase();

  if (
    normalizedMessage.includes("ACCOUNT_WITHDRAWAL_ALREADY_PENDING") ||
    normalizedMessage.includes("UPCOMING_MATCH_APPLICATIONS_EXIST") ||
    normalizedMessage.includes("PENDING_CHARGE_ORDER_EXISTS") ||
    normalizedMessage.includes("PENDING_REFUND_REQUEST_EXISTS") ||
    normalizedMessage.includes("ACCOUNT_NOT_ACTIVE")
  ) {
    return 409;
  }

  if (
    normalizedMessage.includes("INVALID_BANK_NAME") ||
    normalizedMessage.includes("INVALID_ACCOUNT_NUMBER") ||
    normalizedMessage.includes("INVALID_ACCOUNT_HOLDER")
  ) {
    return 400;
  }

  return 500;
}
