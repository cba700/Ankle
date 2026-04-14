"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildAuthContinueHref,
  buildLoginHref,
  normalizeWelcomeNextPath,
} from "@/lib/auth/redirect";
import { getMemberSetupState } from "@/lib/member-access";
import {
  normalizePreferredTimeSlots,
  normalizePreferredWeekdays,
  toTemporaryLevel,
} from "@/lib/player-preferences";
import { updateProfileOnboardingPreferences } from "@/lib/profile-onboarding";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function completeWelcomeOnboardingAction(formData: FormData) {
  const { configured, user } = await getServerUserState();
  const nextPath = normalizeWelcomeNextPath(
    String(formData.get("nextPath") ?? "/"),
  );

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/welcome",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/welcome", "supabase_not_configured"));
  }

  await assertProfileOnboardingSchemaReady(supabase);

  const setupState = await getMemberSetupState(supabase, user.id);

  if (setupState.phoneVerificationRequired) {
    redirect(buildAuthContinueHref(nextPath));
  }

  const temporaryLevel = toTemporaryLevel(
    String(formData.get("temporaryLevelChoice") ?? ""),
  );

  if (!temporaryLevel) {
    throw new Error("Temporary level is required");
  }

  await updateProfileOnboardingPreferences({
    completeOnboarding: true,
    preferredTimeSlots: normalizePreferredTimeSlots(
      formData.getAll("preferredTimeSlots").map(String),
    ),
    preferredWeekdays: normalizePreferredWeekdays(
      formData.getAll("preferredWeekdays").map(String),
    ),
    supabase,
    temporaryLevel,
    userId: user.id,
  });

  revalidatePath("/welcome");
  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  redirect(nextPath);
}
