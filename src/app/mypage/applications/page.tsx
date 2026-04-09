import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageApplications } from "@/components/mypage/my-page-applications";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "신청 내역",
  description: "앵클에서 신청한 매치를 날짜별로 확인하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageApplicationsRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/applications",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const data = await getMyPageData({
    role,
    user,
  });

  return (
    <MyPageApplications
      applications={data.applications}
      initialIsAdmin={data.profile.role === "admin"}
    />
  );
}
