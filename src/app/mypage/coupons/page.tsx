import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageCoupons } from "@/components/mypage/my-page-coupons";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "쿠폰",
  description: "앵클 쿠폰 보유 수를 확인하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageCouponsRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/coupons",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/coupons", "supabase_not_configured"));
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/mypage/coupons",
    { skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const data = await getMyPageData({
    role,
    user,
  });

  return (
    <MyPageCoupons
      couponCount={data.couponCount}
      initialIsAdmin={data.profile.role === "admin"}
    />
  );
}
