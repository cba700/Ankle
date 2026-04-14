import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildAuthContinueHref,
  buildLoginHref,
  normalizeVerifyPhoneNextPath,
} from "@/lib/auth/redirect";
import { getMemberSetupState } from "@/lib/member-access";
import { VerifyPhonePage } from "@/components/login/verify-phone-page";
import { getServerUserState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "휴대폰 인증",
  description: "앵클 계정 휴대폰 인증 화면",
};

export default async function VerifyPhoneRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizeVerifyPhoneNextPath(
    toSearchParam(resolvedSearchParams.next),
  );
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

  const setupState = await getMemberSetupState(supabase, user.id);

  if (!setupState.phoneVerificationRequired) {
    redirect(buildAuthContinueHref(nextPath));
  }

  return (
    <VerifyPhonePage
      accountLabel={user.email ?? "카카오 계정"}
      nextPath={nextPath}
    />
  );
}

function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
