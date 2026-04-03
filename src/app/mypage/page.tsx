import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPage } from "@/components/mypage/my-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "마이페이지 | 앵클",
  description: "앵클 계정 정보와 신청 내역을 확인하는 마이페이지",
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

  const data = await getMyPageData({
    role,
    user,
  });

  return <MyPage data={data} />;
}
