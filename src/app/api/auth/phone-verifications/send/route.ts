import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  PhoneVerificationError,
  sendPhoneVerificationCode,
  type PhoneVerificationPurpose,
} from "@/lib/phone-auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";

type SendBody = {
  phoneNumber?: unknown;
  purpose?: unknown;
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

  const body = (await request.json().catch(() => null)) as SendBody | null;
  const phoneNumber =
    typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const purpose = toPurpose(body?.purpose);

  if (!phoneNumber || !purpose) {
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
    const result = await sendPhoneVerificationCode(admin, {
      phoneNumber,
      purpose,
      requestIp: getRequestIp(request),
      userAgent: request.headers.get("user-agent") ?? "",
      userId,
    });

    return NextResponse.json(
      {
        ...result,
        ok: true,
      },
      { headers: PRIVATE_NO_STORE_HEADERS },
    );
  } catch (error) {
    if (error instanceof PhoneVerificationError) {
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        { headers: PRIVATE_NO_STORE_HEADERS, status: error.httpStatus },
      );
    }

    throw error;
  }
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

function toPurpose(value: unknown): PhoneVerificationPurpose | null {
  return value === "activation" || value === "signup" ? value : null;
}
