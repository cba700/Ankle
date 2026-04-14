import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageCash } from "@/components/mypage/my-page-cash";
import { buildLoginHref } from "@/lib/auth/redirect";
import { maskCashRefundAccountNumber } from "@/lib/cash-refunds";
import { getPendingCashRefundRequestByUserId } from "@/lib/cash";
import { formatCompactDateLabel, formatMoney, formatSeoulTime } from "@/lib/date";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";
import { assertCashRefundRequestSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/cash", "supabase_not_configured"));
  }

  await assertCashRefundRequestSchemaReady(supabase);

  const pendingRefundRequest = await getPendingCashRefundRequestByUserId(
    supabase,
    user.id,
  );

  return (
    <MyPageCash
      cashBalanceAmount={data.cashBalanceAmount}
      cashBalanceLabel={data.cashBalanceLabel}
      cashTransactions={data.cashTransactions}
      displayName={data.profile.displayName}
      initialIsAdmin={data.profile.role === "admin"}
      pendingRefundRequest={
        pendingRefundRequest
          ? {
              accountHolder: pendingRefundRequest.accountHolder,
              accountNumberLabel: `${pendingRefundRequest.bankName} ${maskCashRefundAccountNumber(
                pendingRefundRequest.accountNumber,
              )}`,
              createdAtLabel: `${formatCompactDateLabel(
                new Date(pendingRefundRequest.createdAt),
              )} ${formatSeoulTime(new Date(pendingRefundRequest.createdAt))}`,
              requestedAmountLabel: `${formatMoney(
                pendingRefundRequest.requestedAmount,
              )}원`,
            }
          : null
      }
    />
  );
}
