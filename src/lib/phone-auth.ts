import "server-only";

import { createHmac, randomInt, randomUUID } from "crypto";
import { maskPhoneNumber, normalizeKoreanMobilePhoneNumber } from "@/lib/phone-number";
import { sendSolapiSms } from "@/lib/solapi";
import { getPhoneVerificationSecret } from "@/lib/supabase/env";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>;

export type PhoneVerificationPurpose = "activation" | "signup";

type PhoneVerificationRow = {
  attempt_count: number;
  code_hash: string;
  consumed_at: string | null;
  expires_at: string;
  id: string;
  phone_number_e164: string;
  purpose: PhoneVerificationPurpose;
  status: "blocked" | "consumed" | "expired" | "pending" | "verified";
  user_id: string | null;
  verified_at: string | null;
};

type PhoneVerificationStatus =
  | "PHONE_ALREADY_REGISTERED"
  | "PHONE_NUMBER_INVALID"
  | "PHONE_VERIFICATION_ATTEMPTS_EXCEEDED"
  | "PHONE_VERIFICATION_BLOCKED"
  | "PHONE_VERIFICATION_EXPIRED"
  | "PHONE_VERIFICATION_NOT_FOUND"
  | "PHONE_VERIFICATION_RATE_LIMITED"
  | "PHONE_VERIFICATION_SESSION_MISMATCH"
  | "PHONE_VERIFICATION_STATE_INVALID"
  | "SOLAPI_NOT_CONFIGURED"
  | "SOLAPI_SEND_FAILED";

type SendPhoneVerificationResult = {
  expiresInSeconds: number;
  maskedPhoneNumber: string;
  requestId: string;
  retryAfterSeconds: number;
};

type VerifyPhoneVerificationResult = {
  maskedPhoneNumber: string;
  phoneNumberE164: string;
  verifiedAt: string;
};

const PHONE_VERIFICATION_CODE_LENGTH = 6;
const PHONE_VERIFICATION_EXPIRY_SECONDS = 5 * 60;
const PHONE_VERIFICATION_MAX_ATTEMPTS = 5;
const PHONE_VERIFICATION_PHONE_LIMIT_PER_HOUR = 5;
const PHONE_VERIFICATION_IP_LIMIT_PER_DAY = 20;
const PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;
const SIGNUP_PHONE_COOKIE_NAME = "ankle-signup-phone-verification";
const SIGNUP_PHONE_COOKIE_MAX_AGE_SECONDS = 10 * 60;

export class PhoneVerificationError extends Error {
  code: PhoneVerificationStatus;
  httpStatus: number;
  retryAfterSeconds: number | null;

  constructor(
    code: PhoneVerificationStatus,
    message: string,
    {
      httpStatus,
      retryAfterSeconds = null,
    }: {
      httpStatus: number;
      retryAfterSeconds?: number | null;
    },
  ) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getSignupPhoneVerificationCookieName() {
  return SIGNUP_PHONE_COOKIE_NAME;
}

export function getSignupPhoneVerificationCookieMaxAgeSeconds() {
  return SIGNUP_PHONE_COOKIE_MAX_AGE_SECONDS;
}

export async function sendPhoneVerificationCode(
  admin: AdminClient,
  {
    phoneNumber,
    purpose,
    requestIp,
    userAgent,
    userId = null,
  }: {
    phoneNumber: string;
    purpose: PhoneVerificationPurpose;
    requestIp: string | null;
    userAgent: string;
    userId?: string | null;
  },
): Promise<SendPhoneVerificationResult> {
  const normalizedPhone = normalizeKoreanMobilePhoneNumber(phoneNumber);

  if (!normalizedPhone) {
    throw new PhoneVerificationError(
      "PHONE_NUMBER_INVALID",
      "대한민국 휴대폰 번호를 정확히 입력해 주세요.",
      { httpStatus: 400 },
    );
  }

  await assertPhoneOwnershipAvailable(admin, normalizedPhone.e164, userId);
  await assertSendRateLimit(admin, normalizedPhone.e164, requestIp, purpose, userId);

  const requestId = randomUUID();
  const verificationCode = randomInt(
    0,
    10 ** PHONE_VERIFICATION_CODE_LENGTH,
  )
    .toString()
    .padStart(PHONE_VERIFICATION_CODE_LENGTH, "0");
  const expiresAt = new Date(
    Date.now() + PHONE_VERIFICATION_EXPIRY_SECONDS * 1000,
  ).toISOString();
  const { error: insertError } = await getPhoneVerificationRequestsQuery(admin)
    .insert({
      code_hash: createPhoneVerificationHash({
        code: verificationCode,
        phoneNumberE164: normalizedPhone.e164,
        requestId,
      }),
      expires_at: expiresAt,
      id: requestId,
      phone_number_e164: normalizedPhone.e164,
      purpose,
      request_ip: requestIp,
      user_agent: userAgent,
      user_id: userId,
      vendor: "solapi",
    });

  if (insertError) {
    throw new Error(`Failed to create phone verification request: ${insertError.message}`);
  }

  const smsResult = await sendSolapiSms({
    text: `[앵클] 인증번호 ${verificationCode}를 입력해 주세요. 5분 안에 입력해야 합니다.`,
    to: normalizedPhone.local,
  });

  if (!smsResult.ok) {
    await getPhoneVerificationRequestsQuery(admin)
      .update({
        status: "blocked",
      })
      .eq("id", requestId);

    throw new PhoneVerificationError(
      smsResult.code === "SOLAPI_NOT_CONFIGURED"
        ? "SOLAPI_NOT_CONFIGURED"
        : "SOLAPI_SEND_FAILED",
      smsResult.message,
      {
        httpStatus: smsResult.code === "SOLAPI_NOT_CONFIGURED" ? 503 : 502,
      },
    );
  }

  await getPhoneVerificationRequestsQuery(admin)
    .update({
      vendor_message_id: smsResult.vendorMessageId,
    })
    .eq("id", requestId);

  return {
    expiresInSeconds: PHONE_VERIFICATION_EXPIRY_SECONDS,
    maskedPhoneNumber: maskPhoneNumber(normalizedPhone.e164),
    requestId,
    retryAfterSeconds: PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS,
  };
}

export async function verifyPhoneVerificationCode(
  admin: AdminClient,
  {
    code,
    phoneNumber,
    purpose,
    requestId,
    userId = null,
  }: {
    code: string;
    phoneNumber: string;
    purpose: PhoneVerificationPurpose;
    requestId: string;
    userId?: string | null;
  },
): Promise<VerifyPhoneVerificationResult> {
  const normalizedPhone = normalizeKoreanMobilePhoneNumber(phoneNumber);
  const trimmedCode = code.replace(/\D/g, "");

  if (!normalizedPhone) {
    throw new PhoneVerificationError(
      "PHONE_NUMBER_INVALID",
      "대한민국 휴대폰 번호를 정확히 입력해 주세요.",
      { httpStatus: 400 },
    );
  }

  if (trimmedCode.length !== PHONE_VERIFICATION_CODE_LENGTH) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_STATE_INVALID",
      "인증번호 여섯 자리를 입력해 주세요.",
      { httpStatus: 400 },
    );
  }

  const request = await getPhoneVerificationRequest(admin, requestId);

  if (
    request.purpose !== purpose ||
    request.phone_number_e164 !== normalizedPhone.e164
  ) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_SESSION_MISMATCH",
      "현재 인증 요청과 일치하지 않습니다. 인증번호를 다시 요청해 주세요.",
      { httpStatus: 409 },
    );
  }

  if (purpose === "activation" && (!userId || request.user_id !== userId)) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_SESSION_MISMATCH",
      "현재 로그인된 계정과 인증 요청이 일치하지 않습니다.",
      { httpStatus: 403 },
    );
  }

  if (request.status === "consumed") {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_STATE_INVALID",
      "이미 사용된 인증 요청입니다. 다시 시도해 주세요.",
      { httpStatus: 409 },
    );
  }

  if (request.status === "blocked") {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_BLOCKED",
      "인증 시도가 너무 많습니다. 잠시 후 다시 요청해 주세요.",
      { httpStatus: 429 },
    );
  }

  if (new Date(request.expires_at).getTime() <= Date.now()) {
    await markPhoneVerificationExpired(admin, requestId);

    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_EXPIRED",
      "인증번호가 만료되었습니다. 다시 요청해 주세요.",
      { httpStatus: 410 },
    );
  }

  if (request.status === "verified" && request.verified_at) {
    if (purpose === "activation" && userId) {
      await activateVerifiedPhoneForUser(admin, {
        phoneNumberE164: request.phone_number_e164,
        requestId,
        userId,
      });
    }

    return {
      maskedPhoneNumber: maskPhoneNumber(request.phone_number_e164),
      phoneNumberE164: request.phone_number_e164,
      verifiedAt: request.verified_at,
    };
  }

  const expectedHash = createPhoneVerificationHash({
    code: trimmedCode,
    phoneNumberE164: request.phone_number_e164,
    requestId,
  });

  if (request.code_hash !== expectedHash) {
    const nextAttemptCount = request.attempt_count + 1;
    const nextStatus =
      nextAttemptCount >= PHONE_VERIFICATION_MAX_ATTEMPTS ? "blocked" : "pending";

    await getPhoneVerificationRequestsQuery(admin)
      .update({
        attempt_count: nextAttemptCount,
        status: nextStatus,
      })
      .eq("id", requestId);

    throw new PhoneVerificationError(
      nextStatus === "blocked"
        ? "PHONE_VERIFICATION_ATTEMPTS_EXCEEDED"
        : "PHONE_VERIFICATION_STATE_INVALID",
      nextStatus === "blocked"
        ? "인증 시도가 너무 많습니다. 인증번호를 다시 요청해 주세요."
        : "인증번호가 올바르지 않습니다.",
      {
        httpStatus: nextStatus === "blocked" ? 429 : 400,
      },
    );
  }

  const verifiedAt = new Date().toISOString();
  const { error: verifyError } = await getPhoneVerificationRequestsQuery(admin)
    .update({
      status: "verified",
      verified_at: verifiedAt,
    })
    .eq("id", requestId);

  if (verifyError) {
    throw new Error(`Failed to mark phone verification as verified: ${verifyError.message}`);
  }

  if (purpose === "activation" && userId) {
    await activateVerifiedPhoneForUser(admin, {
      phoneNumberE164: request.phone_number_e164,
      requestId,
      userId,
    });
  }

  return {
    maskedPhoneNumber: maskPhoneNumber(request.phone_number_e164),
    phoneNumberE164: request.phone_number_e164,
    verifiedAt,
  };
}

export async function getVerifiedSignupPhoneVerification(
  admin: AdminClient,
  requestId: string,
) {
  const request = await getPhoneVerificationRequest(admin, requestId);

  if (request.purpose !== "signup") {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_SESSION_MISMATCH",
      "회원가입 인증 요청이 아닙니다.",
      { httpStatus: 409 },
    );
  }

  if (request.status !== "verified" || !request.verified_at) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_STATE_INVALID",
      "휴대폰 인증이 아직 완료되지 않았습니다.",
      { httpStatus: 409 },
    );
  }

  if (request.consumed_at) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_STATE_INVALID",
      "이미 사용된 인증 요청입니다.",
      { httpStatus: 409 },
    );
  }

  if (new Date(request.expires_at).getTime() <= Date.now()) {
    await markPhoneVerificationExpired(admin, requestId);

    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_EXPIRED",
      "휴대폰 인증이 만료되었습니다. 다시 인증해 주세요.",
      { httpStatus: 410 },
    );
  }

  return {
    phoneNumberE164: request.phone_number_e164,
    requestId: request.id,
    verifiedAt: request.verified_at,
  };
}

export async function consumeVerifiedSignupPhoneVerification(
  admin: AdminClient,
  requestId: string,
) {
  const { error } = await getPhoneVerificationRequestsQuery(admin)
    .update({
      consumed_at: new Date().toISOString(),
      status: "consumed",
    })
    .eq("id", requestId);

  if (error) {
    throw new Error(`Failed to consume signup phone verification: ${error.message}`);
  }
}

export async function assertPhoneOwnershipAvailable(
  admin: AdminClient,
  phoneNumberE164: string,
  userId: string | null,
) {
  const { data, error } = await getProfilesQuery(admin)
    .select("id")
    .eq("phone_number_e164", phoneNumberE164)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check phone ownership: ${error.message}`);
  }

  if (data?.id && data.id !== userId) {
    throw new PhoneVerificationError(
      "PHONE_ALREADY_REGISTERED",
      "이미 가입된 휴대폰 번호입니다. 기존 로그인 방식으로 로그인해 주세요.",
      { httpStatus: 409 },
    );
  }
}

async function assertSendRateLimit(
  admin: AdminClient,
  phoneNumberE164: string,
  requestIp: string | null,
  purpose: PhoneVerificationPurpose,
  userId: string | null,
) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: phoneCount, error: phoneCountError } = await getPhoneVerificationRequestsQuery(
    admin,
  )
    .select("id", { count: "exact", head: true })
    .eq("phone_number_e164", phoneNumberE164)
    .gte("created_at", hourAgo);

  if (phoneCountError) {
    throw new Error(`Failed to count phone verification requests: ${phoneCountError.message}`);
  }

  if ((phoneCount ?? 0) >= PHONE_VERIFICATION_PHONE_LIMIT_PER_HOUR) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_RATE_LIMITED",
      "인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
      {
        httpStatus: 429,
        retryAfterSeconds: PHONE_VERIFICATION_EXPIRY_SECONDS,
      },
    );
  }

  if (requestIp) {
    const { count: ipCount, error: ipCountError } = await getPhoneVerificationRequestsQuery(
      admin,
    )
      .select("id", { count: "exact", head: true })
      .eq("request_ip", requestIp)
      .gte("created_at", dayAgo);

    if (ipCountError) {
      throw new Error(`Failed to count IP verification requests: ${ipCountError.message}`);
    }

    if ((ipCount ?? 0) >= PHONE_VERIFICATION_IP_LIMIT_PER_DAY) {
      throw new PhoneVerificationError(
        "PHONE_VERIFICATION_RATE_LIMITED",
        "인증 요청이 너무 많습니다. 내일 다시 시도해 주세요.",
        {
          httpStatus: 429,
          retryAfterSeconds: 60 * 60,
        },
      );
    }
  }

  let resendQuery = getPhoneVerificationRequestsQuery(admin)
    .select("last_sent_at")
    .eq("phone_number_e164", phoneNumberE164)
    .eq("purpose", purpose)
    .order("created_at", { ascending: false })
    .limit(1);

  if (userId) {
    resendQuery = resendQuery.eq("user_id", userId);
  } else {
    resendQuery = resendQuery.is("user_id", null);
  }

  const { data: resendRows, error: resendError } = await resendQuery;

  if (resendError) {
    throw new Error(`Failed to load resend cooldown state: ${resendError.message}`);
  }

  const lastSentAt =
    typeof resendRows?.[0]?.last_sent_at === "string"
      ? resendRows[0].last_sent_at
      : null;

  if (!lastSentAt) {
    return;
  }

  const secondsSinceLastSend = Math.floor(
    (Date.now() - new Date(lastSentAt).getTime()) / 1000,
  );

  if (secondsSinceLastSend < PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_RATE_LIMITED",
      "인증번호를 너무 자주 요청하고 있습니다. 잠시 후 다시 시도해 주세요.",
      {
        httpStatus: 429,
        retryAfterSeconds:
          PHONE_VERIFICATION_RESEND_COOLDOWN_SECONDS - secondsSinceLastSend,
      },
    );
  }
}

async function getPhoneVerificationRequest(admin: AdminClient, requestId: string) {
  const { data, error } = await getPhoneVerificationRequestsQuery(admin)
    .select(
      "attempt_count, code_hash, consumed_at, expires_at, id, phone_number_e164, purpose, status, user_id, verified_at",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load phone verification request: ${error.message}`);
  }

  if (!data) {
    throw new PhoneVerificationError(
      "PHONE_VERIFICATION_NOT_FOUND",
      "인증 요청을 찾을 수 없습니다. 인증번호를 다시 요청해 주세요.",
      { httpStatus: 404 },
    );
  }

  return data as PhoneVerificationRow;
}

async function activateVerifiedPhoneForUser(
  admin: AdminClient,
  {
    phoneNumberE164,
    requestId,
    userId,
  }: {
    phoneNumberE164: string;
    requestId: string;
    userId: string;
  },
) {
  await assertPhoneOwnershipAvailable(admin, phoneNumberE164, userId);

  const verifiedAt = new Date().toISOString();
  const { error: profileError } = await getProfilesQuery(admin)
    .update({
      phone_number_e164: phoneNumberE164,
      phone_verification_required: false,
      phone_verified_at: verifiedAt,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to activate verified phone: ${profileError.message}`);
  }

  const { error: consumeError } = await getPhoneVerificationRequestsQuery(admin)
    .update({
      consumed_at: verifiedAt,
      status: "consumed",
      verified_at: verifiedAt,
    })
    .eq("id", requestId);

  if (consumeError) {
    throw new Error(`Failed to consume activation phone verification: ${consumeError.message}`);
  }
}

async function markPhoneVerificationExpired(admin: AdminClient, requestId: string) {
  await getPhoneVerificationRequestsQuery(admin)
    .update({
      status: "expired",
    })
    .eq("id", requestId)
    .in("status", ["pending", "verified"]);
}

function createPhoneVerificationHash({
  code,
  phoneNumberE164,
  requestId,
}: {
  code: string;
  phoneNumberE164: string;
  requestId: string;
}) {
  const secret = getPhoneVerificationSecret();

  if (!secret) {
    throw new Error("Phone verification secret is not configured.");
  }

  return createHmac("sha256", secret)
    .update(`${requestId}:${phoneNumberE164}:${code}`)
    .digest("hex");
}

function getPhoneVerificationRequestsQuery(admin: AdminClient) {
  return admin.from("phone_verification_requests" as any) as any;
}

function getProfilesQuery(admin: AdminClient) {
  return admin.from("profiles" as any) as any;
}
