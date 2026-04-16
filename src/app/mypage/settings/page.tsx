import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyPageSettings } from "@/components/mypage/my-page-settings";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getAccountWithdrawalPreview } from "@/lib/account-withdrawal";
import { getPendingCashRefundRequestByUserId } from "@/lib/cash";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getMyPageData } from "@/lib/mypage";
import { getServerAuthState } from "@/lib/supabase/auth";
import { assertAccountWithdrawalSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateMyPageDisplayNameAction,
  updateMyPageTemporaryLevelAction,
} from "./actions";

export const metadata: Metadata = {
  title: "설정",
  description: "앵클 계정 기본 정보와 계정 관리 설정 페이지",
};

export const dynamic = "force-dynamic";

export default async function MyPageSettingsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
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
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/mypage/settings", "supabase_not_configured"));
  }

  await assertAccountWithdrawalSchemaReady(supabase);

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/mypage/settings",
    { skipOnboarding: true, skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const { data: profileRow } = supabase
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const [withdrawalPreview, pendingRefundRequest] = await Promise.all([
    getAccountWithdrawalPreview(supabase, user.id),
    getPendingCashRefundRequestByUserId(supabase, user.id),
  ]);
  const initialActiveDialog =
    readFirstSearchParam(resolvedSearchParams.edit) === "displayName"
      ? "displayName"
      : null;

  return (
    <MyPageSettings
      displayNameDraftValue={readFirstSearchParam(resolvedSearchParams.displayName)}
      displayNameErrorMessage={readFirstSearchParam(
        resolvedSearchParams.displayNameError,
      )}
      displayNameValue={profileRow?.display_name ?? ""}
      displayNameFormAction={updateMyPageDisplayNameAction}
      initialIsAdmin={data.profile.role === "admin"}
      initialActiveDialog={initialActiveDialog}
      temporaryLevelFormAction={updateMyPageTemporaryLevelAction}
      profile={data.profile}
      withdrawalPreview={{
        cashBalanceAmount: data.cashBalanceAmount,
        cashBalanceLabel: data.cashBalanceLabel,
        couponCount: data.couponCount,
        futureMatchCount: withdrawalPreview.futureMatchCount,
        pendingChargeOrderCount: withdrawalPreview.pendingChargeOrderCount,
        pendingRefundRequestedAmountLabel: pendingRefundRequest
          ? `${pendingRefundRequest.requestedAmount.toLocaleString("ko-KR")}원`
          : null,
      }}
    />
  );
}

function readFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
