import { notFound, redirect } from "next/navigation";
import { MatchApplyPage } from "@/components/match/match-apply-page";
import { buildMatchDetailViewModel } from "@/components/match/match-detail-view-model";
import { buildLoginHref } from "@/lib/auth/redirect";
import { listAvailableUserCouponsByUserId } from "@/lib/coupons";
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
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const [{ data: application }, { data: cashAccount }, availableCoupons] = await Promise.all([
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
    listAvailableUserCouponsByUserId(supabase, user.id),
  ]);

  existingApplication = application;
  cashBalance = cashAccount?.balance ?? 0;
  const couponOptions = availableCoupons
    .map((coupon) => {
      const discountAmount = match.price > 0
        ? Math.min(coupon.discountAmountSnapshot, match.price)
        : 0;

      return {
        discountAmount,
        discountLabel: `${formatMoney(discountAmount)}원`,
        id: coupon.id,
        name: coupon.nameSnapshot,
      };
    })
    .filter((coupon) => coupon.discountAmount > 0);

  return (
    <MatchApplyPage
      alreadyApplied={Boolean(existingApplication)}
      availableCoupons={couponOptions}
      canApply={match.canApply}
      cashBalanceLabel={`${formatMoney(cashBalance)}원`}
      priceSummary={{
        originalPriceAmount: match.price,
        originalPriceLabel: `${formatMoney(match.price)}원`,
      }}
      view={buildMatchDetailViewModel(match)}
    />
  );
}
