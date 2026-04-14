import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPage } from "@/components/mypage/my-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "앵클 계정 정보와 주요 메뉴를 확인하는 마이페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage", "supabase_not_configured"));
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/mypage",
    { skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const data = await getMyPageData({
    role,
    user,
  });

  return <MyPage data={data} />;
}
