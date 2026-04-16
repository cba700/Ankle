import { NextResponse } from "next/server";
import { getMatchApplicationError } from "@/lib/match-application-errors";
import {
  cancelMatchReminderNotifications,
  sendUserMatchCancelledNotification,
} from "@/lib/notifications";
import { assertCouponSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
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

  const { data, error } = await supabase.rpc("cancel_match_application", {
    p_match_id: matchId,
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
      cancelMatchReminderNotifications(responsePayload.applicationId),
      sendUserMatchCancelledNotification(responsePayload.applicationId),
    ]);
  }

  return NextResponse.json(responsePayload);
}
