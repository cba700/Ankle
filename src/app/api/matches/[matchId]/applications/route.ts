import { NextResponse } from "next/server";
import { getMatchApplicationError } from "@/lib/match-application-errors";
import { getMemberSetupState } from "@/lib/member-access";
import {
  refreshMatchReminderNotifications,
  sendMatchConfirmedNotification,
} from "@/lib/notifications";
import { assertCouponSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
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

  const payload = (await request.json().catch(() => null)) as
    | {
        couponId?: unknown;
      }
    | null;
  const couponId = normalizeCouponId(payload?.couponId);

  if (payload?.couponId !== undefined && payload?.couponId !== null && !couponId) {
    return NextResponse.json(
      { code: "INVALID_COUPON" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase.rpc("apply_to_match", {
    p_match_id: matchId,
    p_coupon_id: couponId,
  });

  if (error) {
    const mapped = getMatchApplicationError(error.message);
    return NextResponse.json({ code: mapped.code }, { status: mapped.status });
  }

  const responsePayload = { ...(data ?? {}), ok: true } as {
    applicationId?: unknown;
  };

  if (typeof responsePayload.applicationId === "string" && responsePayload.applicationId) {
    await Promise.all([
      sendMatchConfirmedNotification(responsePayload.applicationId),
      refreshMatchReminderNotifications(responsePayload.applicationId),
    ]);
  }

  return NextResponse.json(responsePayload);
}

function normalizeCouponId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    normalized,
  )
    ? normalized
    : null;
}
