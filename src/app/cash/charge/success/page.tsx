import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CashChargeSuccessPage } from "@/components/cash/cash-charge-success-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getServerUserState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "충전 완료",
  description: "토스페이먼츠 결제 승인 후 캐시 적립 결과를 확인하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function CashChargeSuccessRoute({
  searchParams,
}: {
  searchParams: Promise<{
    amount?: string;
    next?: string;
    orderId?: string;
    paymentKey?: string;
  }>;
}) {
  const { configured, user } = await getServerUserState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        "/cash/charge",
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref("/cash/charge", "supabase_not_configured"));
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    "/cash/charge",
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const params = await searchParams;

  return (
    <CashChargeSuccessPage
      amount={params.amount ?? null}
      nextPath={normalizeInternalNextPath(params.next ?? null)}
      orderId={params.orderId ?? null}
      paymentKey={params.paymentKey ?? null}
    />
  );
}

function normalizeInternalNextPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}
