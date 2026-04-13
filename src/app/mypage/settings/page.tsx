import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageSettings } from "@/components/mypage/my-page-settings";
import { buildLoginHref, buildWelcomeHref } from "@/lib/auth/redirect";
import { getMyPageData } from "@/lib/mypage";
import { getProfileOnboardingState } from "@/lib/profile-onboarding";
import { getServerAuthState } from "@/lib/supabase/auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateMyPageDisplayNameAction,
  updateMyPageTemporaryLevelAction,
} from "./actions";

export const metadata: Metadata = {
  title: "설정",
  description: "앵클 계정 기본 정보와 계정 관리 설정 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageSettingsRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/settings",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const data = await getMyPageData({
    role,
    user,
  });
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/settings", "supabase_not_configured"));
  }

  await assertProfileOnboardingSchemaReady(supabase);

  const onboardingState = await getProfileOnboardingState(supabase, user.id);

  if (onboardingState.onboardingRequired) {
    redirect(buildWelcomeHref("/mypage/settings"));
  }

  const { data: profileRow } = supabase
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <MyPageSettings
      displayNameValue={profileRow?.display_name ?? ""}
      displayNameFormAction={updateMyPageDisplayNameAction}
      initialIsAdmin={data.profile.role === "admin"}
      temporaryLevelFormAction={updateMyPageTemporaryLevelAction}
      profile={data.profile}
    />
  );
}
