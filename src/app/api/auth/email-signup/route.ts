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
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type EmailSignupBody = {
  email?: unknown;
  password?: unknown;
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

  await assertProfileOnboardingSchemaReady(admin as any);

  const body = (await request.json().catch(() => null)) as EmailSignupBody | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
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

  if (!verificationRequestId) {
    return NextResponse.json(
      {
        code: "PHONE_VERIFICATION_REQUIRED",
        message: "휴대폰 인증을 먼저 완료해 주세요.",
      },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 409 },
    );
  }

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

    const createdUserId = createdUserData.user?.id;

    if (!createdUserId) {
      throw new Error("Supabase did not return a created user.");
    }

    const verifiedAt = new Date().toISOString();
    const { error: updateProfileError } = await (admin.from("profiles" as any) as any)
      .update({
        phone_number_e164: verifiedPhone.phoneNumberE164,
        phone_verification_required: false,
        phone_verified_at: verifiedAt,
      })
      .eq("id", createdUserId);

    if (updateProfileError) {
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch {}

      if (updateProfileError.code === "23505") {
        return NextResponse.json(
          {
            code: "PHONE_ALREADY_REGISTERED",
            message: "이미 가입된 휴대폰 번호입니다. 기존 로그인 방식으로 로그인해 주세요.",
          },
          { headers: PRIVATE_NO_STORE_HEADERS, status: 409 },
        );
      }

      throw new Error(`Failed to update new profile with phone number: ${updateProfileError.message}`);
    }

    await consumeVerifiedSignupPhoneVerification(admin, verificationRequestId);

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

    throw error;
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
