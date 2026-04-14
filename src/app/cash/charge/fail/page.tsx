import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CashChargeFailPage } from "@/components/cash/cash-charge-fail-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getServerUserState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "충전 실패",
  description: "토스페이먼츠 충전 실패 사유를 안내하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function CashChargeFailRoute({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
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
    <CashChargeFailPage
      code={params.code ?? null}
      message={params.message ?? null}
      orderId={params.orderId ?? null}
    />
  );
}
