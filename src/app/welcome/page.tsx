import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomePage } from "@/components/welcome/welcome-page";
import {
  buildLoginHref,
  normalizeWelcomeNextPath,
} from "@/lib/auth/redirect";
import { getMemberSetupState } from "@/lib/member-access";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { completeWelcomeOnboardingAction } from "./actions";

export const metadata: Metadata = {
  title: "첫 설정",
  description: "임시 레벨과 선호 요일 및 시간대를 설정하는 신규 가입 온보딩 화면",
};

export const dynamic = "force-dynamic";

export default async function WelcomeRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeWelcomeNextPath(toSearchParam(resolvedSearchParams.next));
  const { configured, user } = await getServerUserState();

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

  const onboardingState = await getMemberSetupState(supabase, user.id);

  if (!onboardingState.onboardingRequired) {
    redirect(nextPath);
  }

  return (
    <WelcomePage
      formAction={completeWelcomeOnboardingAction}
      initialPreferredTimeSlots={onboardingState.preferredTimeSlots}
      initialPreferredWeekdays={onboardingState.preferredWeekdays}
      initialTemporaryLevel={onboardingState.temporaryLevel}
      nextPath={nextPath}
    />
  );
}

function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
