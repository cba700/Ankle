import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  assertPhoneOwnershipAvailable,
  consumeVerifiedSignupPhoneVerification,
  getSignupPhoneVerificationCookieName,
  getVerifiedSignupPhoneVerification,
  PhoneVerificationError,
} from "@/lib/phone-auth";
import {
  areRequiredSignupAgreementsAccepted,
  isAtLeastAge,
  normalizeBirthDate,
  normalizeLegalName,
  normalizeProfileGender,
  normalizeSignupAgreementValues,
} from "@/lib/signup-profile";
import { saveSignupProfileData } from "@/lib/signup-profile-server";
import { ensureAuthUserBootstrap } from "@/lib/auth/user-bootstrap";
import {
  getReferralErrorPayload,
  recordReferralSignup,
  validateReferralCodeForSignup,
} from "@/lib/referrals";
import { normalizeReferralCode } from "@/lib/referral-code";
import { assertSignupProfileSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type EmailSignupBody = {
  agreements?: unknown;
  birthDate?: unknown;
  email?: unknown;
  gender?: unknown;
  name?: unknown;
  password?: unknown;
  referralCode?: unknown;
};

export async function POST(request: Request) {
  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    return NextResponse.json(
      {
        code: "SERVICE_ROLE_NOT_CONFIGURED",
        message: "회원가입 서버 권한이 설정되지 않았습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  await assertSignupProfileSchemaReady(admin as any);

  const body = (await request.json().catch(() => null)) as EmailSignupBody | null;
  const agreements = normalizeSignupAgreementValues(body?.agreements);
  const birthDate = normalizeBirthDate(body?.birthDate);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const gender = normalizeProfileGender(body?.gender);
  const legalName = normalizeLegalName(body?.name);
  const password = typeof body?.password === "string" ? body.password : "";
  const referralCode = normalizeReferralCode(body?.referralCode);
  const cookieStore = await cookies();
  const verificationRequestId =
    cookieStore.get(getSignupPhoneVerificationCookieName())?.value ?? "";

  if (!isValidEmail(email) || !isValidPassword(password)) {
    return NextResponse.json(
      {
        code: "INVALID_EMAIL_SIGNUP_REQUEST",
        message: "이메일과 비밀번호를 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!legalName || !birthDate || !gender) {
    return NextResponse.json(
      {
        code: "INVALID_SIGNUP_PROFILE",
        message: "이름, 생년월일, 성별을 다시 확인해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!areRequiredSignupAgreementsAccepted(agreements)) {
    return NextResponse.json(
      {
        code: "REQUIRED_CONSENTS_MISSING",
        message: "필수 약관에 모두 동의해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!isAtLeastAge(birthDate, 16)) {
    return NextResponse.json(
      {
        code: "AGE_REQUIREMENT_NOT_MET",
        message: "만 16세 이상만 가입할 수 있습니다.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  if (!verificationRequestId) {
    return NextResponse.json(
      {
        code: "PHONE_VERIFICATION_REQUIRED",
        message: "휴대폰 인증을 먼저 완료해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 409 },
    );
  }

  if (referralCode) {
    try {
      await validateReferralCodeForSignup(admin as any, {
        referralCode,
      });
    } catch (error) {
      const referralError = getReferralErrorPayload(error);

      return NextResponse.json(
        {
          code: referralError.code,
          message: referralError.message,
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: referralError.status },
      );
    }
  }

  let createdUserId: string | null = null;

  try {
    const verifiedPhone = await getVerifiedSignupPhoneVerification(
      admin,
      verificationRequestId,
    );

    await assertPhoneOwnershipAvailable(admin, verifiedPhone.phoneNumberE164, null);

    const { data: createdUserData, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password,
        user_metadata: {
          name: legalName,
        },
      });

    if (createUserError) {
      const response = NextResponse.json(
        mapCreateUserError(createUserError.message),
        {
          headers: PRIVATE_NO_STORE_HEADERS,
          status: createUserError.message.toLowerCase().includes("registered")
            ? 409
            : 400,
        },
      );

      response.cookies.set(getSignupPhoneVerificationCookieName(), verificationRequestId, {
        httpOnly: true,
        maxAge: 10 * 60,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    const createdUser = createdUserData.user ?? null;

    if (!createdUser?.id) {
      throw new Error("Supabase did not return a created user.");
    }

    createdUserId = createdUser.id;

    await ensureAuthUserBootstrap(createdUser, admin);

    const verifiedAt = new Date().toISOString();
    const { error: phoneProfileError } = await (admin.from("profiles" as any) as any)
      .update({
        phone_number_e164: verifiedPhone.phoneNumberE164,
        phone_verification_required: false,
        phone_verified_at: verifiedAt,
      })
      .eq("id", createdUserId);

    if (phoneProfileError) {
      if (phoneProfileError.code === "23505") {
        try {
          await admin.auth.admin.deleteUser(createdUserId);
        } catch {}

        return NextResponse.json(
          {
            code: "PHONE_ALREADY_REGISTERED",
            message: "이미 가입된 휴대폰 번호입니다. 기존 로그인 방식으로 로그인해 주세요.",
          },
          { headers: PRIVATE_NO_STORE_HEADERS, status: 409 },
        );
      }

      throw new Error(`Failed to update new profile with phone number: ${phoneProfileError.message}`);
    }

    await saveSignupProfileData(admin as any, {
      agreements,
      birthDate,
      gender,
      legalName,
      source: "email_signup",
      userId: createdUserId,
    });

    await consumeVerifiedSignupPhoneVerification(admin, verificationRequestId);

    if (referralCode) {
      await recordReferralSignup(admin as any, {
        inviteeId: createdUserId,
        referralCode,
      });
    }

    const response = NextResponse.json(
      {
        email,
        ok: true,
      },
      { headers: PRIVATE_NO_STORE_HEADERS },
    );

    response.cookies.set(getSignupPhoneVerificationCookieName(), "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      const response = NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: error.httpStatus },
      );

      if (
        error.code === "PHONE_VERIFICATION_EXPIRED" ||
        error.code === "PHONE_VERIFICATION_STATE_INVALID"
      ) {
        response.cookies.set(getSignupPhoneVerificationCookieName(), "", {
          httpOnly: true,
          maxAge: 0,
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }

      return response;
    }

    const message = error instanceof Error ? error.message : String(error);

    if (createdUserId) {
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch {}
    }

    const referralError = getReferralErrorPayload(error);

    if (referralError.code !== "REFERRAL_FAILED") {
      return NextResponse.json(
        {
          code: referralError.code,
          message: referralError.message,
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: referralError.status },
      );
    }

    console.error("[email-signup]", {
      message,
      provider: "email",
      stage: "signup",
      userId: createdUserId,
    });

    return NextResponse.json(
      {
        code: "EMAIL_SIGNUP_FAILED",
        message: "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
    );
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string) {
  return password.length >= 8 && password.length <= 72;
}

function mapCreateUserError(message: string) {
  if (message.toLowerCase().includes("registered")) {
    return {
      code: "EMAIL_ALREADY_REGISTERED",
      message: "이미 가입된 이메일입니다. 로그인해 주세요.",
    };
  }

  return {
    code: "EMAIL_SIGNUP_FAILED",
    message: "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  };
}
