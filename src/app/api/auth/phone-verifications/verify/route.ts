import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  getSignupPhoneVerificationCookieMaxAgeSeconds,
  getSignupPhoneVerificationCookieName,
  PhoneVerificationError,
  verifyPhoneVerificationCode,
  type PhoneVerificationPurpose,
} from "@/lib/phone-auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type VerifyBody = {
  code?: unknown;
  phoneNumber?: unknown;
  purpose?: unknown;
  requestId?: unknown;
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

  const body = (await request.json().catch(() => null)) as VerifyBody | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const phoneNumber =
    typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const purpose = toPurpose(body?.purpose);
  const requestId =
    typeof body?.requestId === "string" ? body.requestId.trim() : "";

  if (!code || !phoneNumber || !purpose || !requestId) {
    return NextResponse.json(
      { code: "INVALID_PHONE_VERIFICATION_REQUEST", message: "요청값이 올바르지 않습니다." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
    );
  }

  let userId: string | null = null;

  if (purpose === "activation") {
    const supabase = await getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
        { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
      );
    }

    await assertProfileOnboardingSchemaReady(supabase);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { code: "AUTH_REQUIRED", message: "로그인이 필요한 기능입니다." },
        { headers: PRIVATE_NO_STORE_HEADERS, status: 401 },
      );
    }

    userId = user.id;
  }

  try {
    const result = await verifyPhoneVerificationCode(admin, {
      code,
      phoneNumber,
      purpose,
      requestId,
      userId,
    });
    const response = NextResponse.json(
      {
        ...result,
        ok: true,
      },
      { headers: PRIVATE_NO_STORE_HEADERS },
    );

    if (purpose === "signup") {
      response.cookies.set(getSignupPhoneVerificationCookieName(), requestId, {
        httpOnly: true,
        maxAge: getSignupPhoneVerificationCookieMaxAgeSeconds(),
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      const response = NextResponse.json(
        {
          code: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: error.httpStatus },
      );

      if (purpose === "signup") {
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

function toPurpose(value: unknown): PhoneVerificationPurpose | null {
  return value === "activation" || value === "signup" ? value : null;
}
