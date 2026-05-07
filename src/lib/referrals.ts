import "server-only";

import { normalizeReferralCode, isValidReferralCodeFormat } from "@/lib/referral-code";
import { assertReferralSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ReferralRpcClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

type ReferralProfileRow = {
  referral_code: string | null;
};

export type ReferralPageData = {
  invitedCount: number;
  referralCode: string;
};

export type ReferralErrorPayload = {
  code: string;
  message: string;
  status: number;
};

const REFERRAL_ERROR_MESSAGES: Record<string, Omit<ReferralErrorPayload, "code">> = {
  REFERRAL_ALREADY_APPLIED: {
    message: "이미 초대 코드가 적용된 계정입니다.",
    status: 409,
  },
  REFERRAL_CODE_INVALID: {
    message: "초대 코드는 영문과 숫자 5자리로 입력해 주세요.",
    status: 400,
  },
  REFERRAL_CODE_NOT_FOUND: {
    message: "유효하지 않은 초대 코드입니다.",
    status: 400,
  },
  REFERRAL_REWARD_TEMPLATE_NOT_FOUND: {
    message: "초대 보상 쿠폰 설정을 확인해 주세요.",
    status: 500,
  },
  SELF_REFERRAL_NOT_ALLOWED: {
    message: "본인의 초대 코드는 사용할 수 없습니다.",
    status: 400,
  },
};

export async function getReferralPageData({
  supabase,
  userId,
}: {
  supabase: ReferralRpcClient;
  userId: string;
}): Promise<ReferralPageData> {
  await assertReferralSchemaReady(supabase);

  const [{ data: profile, error: profileError }, { count, error: countError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("inviter_id", userId),
    ]);

  if (profileError) {
    throw new Error(`Failed to load referral code: ${profileError.message}`);
  }

  if (countError) {
    throw new Error(`Failed to load referral count: ${countError.message}`);
  }

  const referralCode = ((profile ?? null) as ReferralProfileRow | null)
    ?.referral_code;

  if (!referralCode) {
    throw new Error("Referral code is missing from profile.");
  }

  return {
    invitedCount: count ?? 0,
    referralCode,
  };
}

export async function validateReferralCodeForSignup(
  supabase: ReferralRpcClient,
  {
    inviteeId,
    referralCode,
  }: {
    inviteeId?: string | null;
    referralCode: unknown;
  },
) {
  await assertReferralSchemaReady(supabase);

  const normalizedCode = normalizeReferralCode(referralCode);

  if (!normalizedCode) {
    return null;
  }

  if (!isValidReferralCodeFormat(normalizedCode)) {
    throw new ReferralCodeError("REFERRAL_CODE_INVALID");
  }

  const { data, error } = await (supabase as any).rpc(
    "validate_referral_code_for_signup",
    {
      p_invitee_id: inviteeId ?? null,
      p_referral_code: normalizedCode,
    },
  );

  if (error) {
    throw new ReferralCodeError(getReferralErrorCode(error));
  }

  return data ?? null;
}

export async function recordReferralSignup(
  supabase: ReferralRpcClient,
  {
    inviteeId,
    referralCode,
  }: {
    inviteeId: string;
    referralCode: unknown;
  },
) {
  const normalizedCode = normalizeReferralCode(referralCode);

  if (!normalizedCode) {
    return null;
  }

  const { data, error } = await (supabase as any).rpc("record_referral_signup", {
    p_invitee_id: inviteeId,
    p_referral_code: normalizedCode,
  });

  if (error) {
    throw new ReferralCodeError(getReferralErrorCode(error));
  }

  return data ?? null;
}

export function getReferralErrorPayload(error: unknown): ReferralErrorPayload {
  const code =
    error instanceof ReferralCodeError
      ? error.code
      : getReferralErrorCode(error);
  const mappedError = REFERRAL_ERROR_MESSAGES[code];

  if (mappedError) {
    return {
      code,
      ...mappedError,
    };
  }

  return {
    code: "REFERRAL_FAILED",
    message: "초대 코드 적용에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    status: 500,
  };
}

class ReferralCodeError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

function getReferralErrorCode(error: unknown) {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : "";

  return (
    Object.keys(REFERRAL_ERROR_MESSAGES).find((code) =>
      message.includes(code),
    ) ?? "REFERRAL_FAILED"
  );
}
