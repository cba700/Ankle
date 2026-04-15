import { NextResponse } from "next/server";
import { getMatchApplicationError } from "@/lib/match-application-errors";
import { getMemberSetupState } from "@/lib/member-access";
import { assertCouponSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  await assertCouponSchemaReady(supabase);
  const onboardingState = await getMemberSetupState(supabase, user.id);

  if (onboardingState.phoneVerificationRequired) {
    return NextResponse.json(
      { code: "PHONE_VERIFICATION_REQUIRED" },
      { status: 409 },
    );
  }

  if (onboardingState.onboardingRequired) {
    return NextResponse.json(
      { code: "ONBOARDING_REQUIRED" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase.rpc("apply_to_match", {
    p_match_id: matchId,
  });

  if (error) {
    const mapped = getMatchApplicationError(error.message);
    return NextResponse.json({ code: mapped.code }, { status: mapped.status });
  }

  return NextResponse.json({ ...(data ?? {}), ok: true });
}
