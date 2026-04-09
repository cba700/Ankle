import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageSettings } from "@/components/mypage/my-page-settings";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";

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

  return (
    <MyPageSettings
      initialIsAdmin={data.profile.role === "admin"}
      profile={data.profile}
    />
  );
}
