"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildAuthContinueHref, buildLoginHref } from "@/lib/auth/redirect";
import { getMemberSetupState } from "@/lib/member-access";
import { toTemporaryLevel } from "@/lib/player-preferences";
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

  const setupState = await getMemberSetupState(supabase, user.id);

  if (setupState.onboardingRequired) {
    redirect(buildAuthContinueHref("/mypage/settings"));
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

export async function updateMyPageTemporaryLevelAction(formData: FormData) {
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
  const setupState = await getMemberSetupState(supabase, user.id);

  if (setupState.onboardingRequired) {
    redirect(buildAuthContinueHref("/mypage/settings"));
  }

  const temporaryLevel = toTemporaryLevel(
    String(formData.get("temporaryLevelChoice") ?? ""),
  );

  if (!temporaryLevel) {
    throw new Error("Temporary level is required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      temporary_level: temporaryLevel,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Failed to update temporary level: ${error.message}`);
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  redirect("/mypage/settings");
}
