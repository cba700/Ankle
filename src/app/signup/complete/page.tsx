import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildAuthContinueHref,
  buildLoginHref,
  normalizePostAuthNextPath,
} from "@/lib/auth/redirect";
import { SignupCompletePage } from "@/components/login/signup-complete-page";
import { normalizeReferralCode } from "@/lib/referral-code";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertSignupProfileSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSignupProfileState } from "@/lib/signup-profile-server";

export const metadata: Metadata = {
  title: "가입 정보 확인",
  description: "앵클 가입 정보를 마무리하는 화면",
};

export default async function SignupCompleteRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizePostAuthNextPath(
    toSearchParam(resolvedSearchParams.next),
  );
  const referralCode = normalizeReferralCode(toSearchParam(resolvedSearchParams.ref));
  const { configured, user } = await getServerUserState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        nextPath,
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref(nextPath, "supabase_not_configured"));
  }

  await assertSignupProfileSchemaReady(supabase);

  const signupProfileState = await getSignupProfileState(supabase as any, user.id);

  if (!signupProfileState.signupProfileRequired || signupProfileState.isComplete) {
    redirect(buildAuthContinueHref(nextPath));
  }

  return (
    <SignupCompletePage
      accountLabel={user.email ?? "카카오 계정"}
      initialAgreements={signupProfileState.agreements}
      initialBirthDate={signupProfileState.birthDate}
      initialGender={signupProfileState.gender}
      initialLegalName={
        signupProfileState.legalName ||
        (typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "") ||
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "")
      }
      initialReferralCode={referralCode}
      nextPath={nextPath}
    />
  );
}

function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
