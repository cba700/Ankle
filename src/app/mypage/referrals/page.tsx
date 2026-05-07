import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageReferrals } from "@/components/mypage/my-page-referrals";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getReferralPageData } from "@/lib/referrals";
import { resolveSiteUrl } from "@/lib/site-metadata";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "친구 초대",
  description: "앵클 친구 초대 코드와 보상 쿠폰을 확인하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageReferralsRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/referrals",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/referrals", "supabase_not_configured"));
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/mypage/referrals",
    { skipOnboarding: true, skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const referralData = await getReferralPageData({
    supabase,
    userId: user.id,
  });

  return (
    <MyPageReferrals
      initialIsAdmin={role === "admin"}
      referralCode={referralData.referralCode}
      referralLink={resolveSiteUrl(
        `/login?ref=${encodeURIComponent(referralData.referralCode)}`,
      )}
    />
  );
}
