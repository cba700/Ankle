"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildLoginHref } from "@/lib/auth/redirect";
import { toTemporaryLevel } from "@/lib/player-preferences";
import {
  getDisplayNameValidationMessage,
  normalizeDisplayName,
} from "@/lib/signup-profile";
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

  const displayName = normalizeDisplayName(formData.get("displayName"));
  const displayNameError = getDisplayNameValidationMessage(displayName);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/settings", "supabase_not_configured"));
  }

  if (displayNameError) {
    redirect(buildDisplayNameSettingsHref(displayName, displayNameError));
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

function buildDisplayNameSettingsHref(displayName: string, displayNameError: string) {
  const params = new URLSearchParams();
  params.set("edit", "displayName");
  params.set("displayNameError", displayNameError);

  if (displayName) {
    params.set("displayName", displayName);
  }

  return `/mypage/settings?${params.toString()}`;
}
