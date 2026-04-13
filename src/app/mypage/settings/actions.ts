"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildLoginHref } from "@/lib/auth/redirect";
import {
  normalizePreferredTimeSlots,
  normalizePreferredWeekdays,
  toTemporaryLevel,
} from "@/lib/player-preferences";
import { updateProfileOnboardingPreferences } from "@/lib/profile-onboarding";
import { getServerAuthState } from "@/lib/supabase/auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function updateMyPageDisplayNameAction(formData: FormData) {
  const { configured, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/settings",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/settings", "supabase_not_configured"));
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.length > 0 ? displayName : null,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  redirect("/mypage/settings");
}

export async function updateMyPagePreferencesAction(formData: FormData) {
  const { configured, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/settings",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/settings", "supabase_not_configured"));
  }

  await assertProfileOnboardingSchemaReady(supabase);

  const temporaryLevel = toTemporaryLevel(
    String(formData.get("temporaryLevelChoice") ?? ""),
  );

  if (!temporaryLevel) {
    throw new Error("Temporary level is required");
  }

  await updateProfileOnboardingPreferences({
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

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  redirect("/mypage/settings");
}
