import { NextResponse } from "next/server";
import { clearSingleSessionCookie } from "@/lib/auth/single-session";
import {
  getOriginalPaymentRefundableCashAmountByUserId,
  getPendingCashRefundRequestByUserId,
} from "@/lib/cash";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { processOriginalPaymentCashRefund } from "@/lib/payments/cash-refund";
import { getServerUserState } from "@/lib/supabase/auth";
import {
  assertAccountWithdrawalSchemaReady,
  assertCashRefundRequestSchemaReady,
} from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type AccountWithdrawalBody = {
  agreedToWarnings?: unknown;
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
  await assertCashRefundRequestSchemaReady(supabase);

  const body = (await request.json().catch(() => null)) as AccountWithdrawalBody | null;
  const agreedToWarnings = body?.agreedToWarnings === true;

  if (!agreedToWarnings) {
    return NextResponse.json(
      {
        code: "WITHDRAWAL_CONFIRMATION_REQUIRED",
        message: "탈퇴 전 안내사항을 확인하고 동의해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    const [pendingRefundRequest, refundableCashAmount] = await Promise.all([
      getPendingCashRefundRequestByUserId(supabase, user.id),
      getOriginalPaymentRefundableCashAmountByUserId(supabase, user.id),
    ]);

    if (pendingRefundRequest || refundableCashAmount > 0) {
      return NextResponse.json(
        {
          code: "SERVICE_ROLE_NOT_CONFIGURED",
          message: "회원 탈퇴와 환불 처리를 위한 서버 설정이 완료되지 않았습니다.",
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
      );
    }
  }

  const { data, error } = await supabase.rpc("begin_account_withdrawal", {
    p_account_holder: null,
    p_account_number: null,
    p_bank_name: null,
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

  const result = (data ?? {}) as AccountWithdrawalRpcResult;

  if (result.refundRequestId && (result.requestedAmount ?? 0) > 0) {
    if (!admin) {
      return NextResponse.json(
        {
          code: "SERVICE_ROLE_NOT_CONFIGURED",
          message: "회원 탈퇴와 환불 처리를 위한 서버 설정이 완료되지 않았습니다.",
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
      );
    }

    const refundResult = await processOriginalPaymentCashRefund(admin, {
      refundRequestId: result.refundRequestId,
      requestedAmount: result.requestedAmount ?? 0,
      userId: user.id,
    });

    if (!refundResult.ok) {
      if (result.withdrawalRequestId) {
        const cancelError = await cancelPendingWithdrawal(
          admin,
          result.withdrawalRequestId,
        );

        if (cancelError) {
          return NextResponse.json(
            {
              code: "ACCOUNT_WITHDRAWAL_CANCEL_FAILED",
              message: "환불 실패 후 탈퇴 요청을 되돌리지 못했습니다.",
            },
            { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
          );
        }
      }

      return NextResponse.json(
        {
          code: refundResult.code ?? "ACCOUNT_WITHDRAWAL_REFUND_FAILED",
          message: refundResult.message,
        },
        {
          headers: PRIVATE_NO_STORE_HEADERS,
          status: refundResult.httpStatus ?? 502,
        },
      );
    }

    if (refundResult.refundedAmount < (result.requestedAmount ?? 0)) {
      if (result.withdrawalRequestId) {
        const cancelError = await cancelPendingWithdrawal(
          admin,
          result.withdrawalRequestId,
        );

        if (cancelError) {
          return NextResponse.json(
            {
              code: "ACCOUNT_WITHDRAWAL_CANCEL_FAILED",
              message: "부분 환불 후 탈퇴 요청을 되돌리지 못했습니다.",
            },
            { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
          );
        }
      }

      return NextResponse.json(
        {
          code: refundResult.code ?? "ACCOUNT_WITHDRAWAL_REFUND_PARTIAL",
          message: "일부 캐시가 환불되지 않아 회원 탈퇴를 완료하지 않았습니다.",
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: 409 },
      );
    }

    if (result.withdrawalRequestId) {
      const { data: finalizedData, error: finalizeError } = await admin.rpc(
        "finalize_account_withdrawal",
        {
          p_withdrawal_request_id: result.withdrawalRequestId,
        },
      );

      if (finalizeError) {
        return NextResponse.json(
          {
            code: "ACCOUNT_WITHDRAWAL_FINALIZE_FAILED",
            message: "환불은 접수됐지만 회원 탈퇴 완료 처리에 실패했습니다.",
          },
          { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
        );
      }

      const finalized = (finalizedData ?? {}) as AccountWithdrawalRpcResult;
      result.blockedUntil = finalized.blockedUntil ?? result.blockedUntil ?? null;
      result.status = "withdrawn";
    }
  }

  await supabase.auth.signOut();

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

async function cancelPendingWithdrawal(
  admin: any,
  withdrawalRequestId: string,
) {
  const { error } = await admin.rpc("cancel_account_withdrawal", {
    p_withdrawal_request_id: withdrawalRequestId,
  });

  return error;
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

  if (normalizedMessage.includes("NO_REFUNDABLE_CASH")) {
    return {
      code: "NO_REFUNDABLE_CASH",
      message: "충전 시 사용한 결제수단으로 환불 가능한 캐시가 없어 탈퇴를 진행할 수 없습니다.",
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
    normalizedMessage.includes("NO_REFUNDABLE_CASH") ||
    normalizedMessage.includes("ACCOUNT_NOT_ACTIVE")
  ) {
    return 409;
  }

  return 500;
}
