import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  areRequiredSignupAgreementsAccepted,
  isAtLeastAge,
  normalizeBirthDate,
  normalizeLegalName,
  normalizeProfileGender,
  normalizeSignupAgreementValues,
} from "@/lib/signup-profile";
import { saveSignupProfileData } from "@/lib/signup-profile-server";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertSignupProfileSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SignupCompletionBody = {
  agreements?: unknown;
  birthDate?: unknown;
  gender?: unknown;
  name?: unknown;
};

export async function POST(request: Request) {
  const { configured, user } = await getServerUserState();

  if (!configured || !user) {
    return NextResponse.json(
      {
        code: configured ? "AUTH_REQUIRED" : "SUPABASE_NOT_CONFIGURED",
        message: configured
          ? "로그인이 필요한 기능입니다."
          : "Supabase is not configured.",
      },
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: configured ? 401 : 503,
      },
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED", message: "Supabase is not configured." },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  await assertSignupProfileSchemaReady(supabase);

  const body = (await request.json().catch(() => null)) as SignupCompletionBody | null;
  const agreements = normalizeSignupAgreementValues(body?.agreements);
  const birthDate = normalizeBirthDate(body?.birthDate);
  const gender = normalizeProfileGender(body?.gender);
  const legalName = normalizeLegalName(body?.name);

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

  await saveSignupProfileData(supabase as any, {
    agreements,
    birthDate,
    gender,
    legalName,
    source: "signup_completion",
    userId: user.id,
  });

  return NextResponse.json(
    {
      ok: true,
    },
    { headers: PRIVATE_NO_STORE_HEADERS },
  );
}
