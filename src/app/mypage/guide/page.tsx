import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageGuide } from "@/components/mypage/my-page-guide";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "앵클 레벨 가이드",
  description: "앵클 레벨 구조와 세부 기준을 확인하는 가이드 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageGuideRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/guide",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/guide", "supabase_not_configured"));
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/mypage/guide",
    { skipOnboarding: true, skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  return <MyPageGuide initialIsAdmin={role === "admin"} />;
}
