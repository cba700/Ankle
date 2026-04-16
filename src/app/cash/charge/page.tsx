import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CashChargePage } from "@/components/cash/cash-charge-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import {
  getCashAccountByUserId,
  listCashChargeOrdersByUserId,
} from "@/lib/cash";
import { formatCompactDateLabel, formatMoney } from "@/lib/date";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import {
  assertCashChargeOperationsSchemaReady,
} from "@/lib/supabase/schema";
import { getServerUserState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "캐시 충전",
  description: "토스페이먼츠로 앵클 캐시를 충전하는 페이지",
};

export const dynamic = "force-dynamic";

export default async function CashChargeRoute({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const normalizedNextPath = normalizeInternalNextPath(params.next ?? null);
  const chargePath = normalizedNextPath
    ? `/cash/charge?next=${encodeURIComponent(normalizedNextPath)}`
    : "/cash/charge";
  const { configured, role, user } = await getServerUserState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        chargePath,
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginHref(chargePath, "supabase_not_configured"));
  }

  await assertCashChargeOperationsSchemaReady(supabase);
  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    chargePath,
    { skipPhoneVerification: true },
  );

  if (requiredSetupHref) {
    redirect(requiredSetupHref);
  }

  const [cashAccount, recentOrders] = await Promise.all([
    getCashAccountByUserId(supabase, user.id),
    listCashChargeOrdersByUserId(supabase, user.id, 4),
  ]);
  return (
    <CashChargePage
      accountLabel={user.email ?? "카카오 계정"}
      cashBalanceLabel={`${formatMoney(cashAccount?.balance ?? 0)}원`}
      customerKey={user.id}
      displayName={getDisplayName(user)}
      initialIsAdmin={role === "admin"}
      nextPath={normalizedNextPath}
      recentOrders={recentOrders.map((order) => ({
        amountLabel: `${formatMoney(order.amount)}원`,
        metaLabel: `${formatCompactDateLabel(new Date(order.createdAt))} · ${getOrderMeta(order)}`,
        orderId: order.orderId,
        statusLabel: getOrderStatusLabel(order.status),
        statusTone: getOrderStatusTone(order.status),
      }))}
    />
  );
}

function getDisplayName(user: NonNullable<Awaited<ReturnType<typeof getServerUserState>>["user"]>) {
  if (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) {
    return user.user_metadata.name.trim();
  }

  if (
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
  ) {
    return user.user_metadata.full_name.trim();
  }

  return user.email ?? "앵클 사용자";
}

function getOrderMeta(order: Awaited<ReturnType<typeof listCashChargeOrdersByUserId>>[number]) {
  if (order.status === "paid" && order.approvedAt) {
    return "적립 완료";
  }

  if (order.status === "pending") {
    return "승인 대기";
  }

  if (order.status === "expired") {
    return "주문 만료";
  }

  if (order.status === "cancelled") {
    return "사용자 취소";
  }

  return getOrderFailureMeta(order.lastErrorCode ?? order.failureCode);
}

function getOrderStatusLabel(
  status: Awaited<ReturnType<typeof listCashChargeOrdersByUserId>>[number]["status"],
) {
  switch (status) {
    case "paid":
      return "결제 완료";
    case "failed":
      return "결제 실패";
    case "cancelled":
      return "주문 취소";
    case "expired":
      return "주문 만료";
    case "pending":
    default:
      return "결제 대기";
  }
}

function getOrderStatusTone(
  status: Awaited<ReturnType<typeof listCashChargeOrdersByUserId>>[number]["status"],
) {
  if (status === "paid") {
    return "accent" as const;
  }

  if (status === "failed" || status === "expired") {
    return "danger" as const;
  }

  return "neutral" as const;
}

function getOrderFailureMeta(code: string | null) {
  if (code === "PAY_PROCESS_CANCELED") {
    return "사용자 취소";
  }

  if (code === "PAYMENT_WINDOW_OPEN_FAILED") {
    return "결제창 실행 실패";
  }

  return "결제 실패";
}

function normalizeInternalNextPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}
