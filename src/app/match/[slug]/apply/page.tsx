import { notFound, redirect } from "next/navigation";
import { MatchApplyPage } from "@/components/match/match-apply-page";
import { buildMatchDetailViewModel } from "@/components/match/match-detail-view-model";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getAvailableSignupCouponByUserId } from "@/lib/coupons";
import { formatMoney } from "@/lib/date";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getPublicMatchByPublicId } from "@/lib/matches-data";
import {
  assertCouponSchemaReady,
} from "@/lib/supabase/schema";
import { getServerUserState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MatchApply({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: publicId } = await params;
  const [match, { configured, user }] = await Promise.all([
    getPublicMatchByPublicId(publicId),
    getServerUserState(),
  ]);

  if (!match) {
    notFound();
  }

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        `/match/${match.publicId}/apply`,
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const accountLabel =
    user.email ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "카카오 계정");
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref(`/match/${match.publicId}/apply`, "supabase_not_configured"));
  }

  let cashBalance = 0;
  let existingApplication = null;

  await assertCouponSchemaReady(supabase);
  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    `/match/${match.publicId}/apply`,
    { skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const [{ data: application }, { data: cashAccount }, availableCoupon] = await Promise.all([
    supabase
      .from("match_applications")
      .select("id")
      .eq("match_id", match.id)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .maybeSingle(),
    supabase
      .from("cash_accounts")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    getAvailableSignupCouponByUserId(supabase, user.id),
  ]);

  existingApplication = application;
  cashBalance = cashAccount?.balance ?? 0;
  const couponDiscountAmount =
    match.price > 0 && availableCoupon
      ? Math.min(availableCoupon.discountAmountSnapshot, match.price)
      : 0;
  const finalChargeAmount = Math.max(match.price - couponDiscountAmount, 0);

  return (
    <MatchApplyPage
      accountLabel={accountLabel}
      alreadyApplied={Boolean(existingApplication)}
      canApply={match.canApply}
      cashBalanceLabel={`${formatMoney(cashBalance)}원`}
      priceSummary={{
        couponDiscountAmount,
        couponDiscountLabel:
          couponDiscountAmount > 0 ? `${formatMoney(couponDiscountAmount)}원` : null,
        couponName: couponDiscountAmount > 0 ? availableCoupon?.nameSnapshot ?? null : null,
        finalChargeAmount,
        finalChargeLabel: `${formatMoney(finalChargeAmount)}원`,
        originalPriceLabel: `${formatMoney(match.price)}원`,
      }}
      view={buildMatchDetailViewModel(match)}
    />
  );
}
