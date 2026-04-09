import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageCash } from "@/components/mypage/my-page-cash";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "캐시 내역",
  description: "앵클 캐시 잔액과 상세 거래 내역을 확인하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageCashRoute() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/mypage/cash",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const data = await getMyPageData({
    role,
    user,
  });

  return (
    <MyPageCash
      cashBalanceLabel={data.cashBalanceLabel}
      cashTransactions={data.cashTransactions}
      initialIsAdmin={data.profile.role === "admin"}
    />
  );
}
