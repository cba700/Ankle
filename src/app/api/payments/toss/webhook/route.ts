import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type WebhookPayload = {
  data?: Record<string, unknown>;
  eventType?: unknown;
};

type ChargeOrderRow = {
  amount: number;
  id: string;
  order_id: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
};

type ChargeOrderEventRow = {
  id: string;
};

export async function POST(request: Request) {
  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json(
      { code: "SERVICE_ROLE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as WebhookPayload | null;

  if (!payload) {
    return NextResponse.json(
      { code: "INVALID_WEBHOOK_PAYLOAD" },
      { status: 400 },
    );
  }

  const eventType =
    typeof payload.eventType === "string" ? payload.eventType : "UNKNOWN";
  const data = isRecord(payload.data) ? payload.data : {};
  const orderId =
    typeof data.orderId === "string" && data.orderId.trim()
      ? data.orderId.trim()
      : `unresolved:${crypto.randomUUID()}`;
  const transmissionId =
    request.headers.get("tosspayments-webhook-transmission-id") ??
    `${eventType}:${orderId}`;

  const { data: order } = await admin
    .from("cash_charge_orders")
    .select("id, order_id, amount, status")
    .eq("order_id", orderId)
    .maybeSingle();

  const typedOrder = order as ChargeOrderRow | null;
  const { data: event, error: eventError } = await admin
    .from("cash_charge_order_events")
    .insert({
      charge_order_id: typedOrder?.id ?? null,
      event_type: eventType,
      order_id: orderId,
      payload,
      processed_result: "received",
      processed_at: new Date().toISOString(),
      provider_event_id: transmissionId,
    })
    .select("id")
    .maybeSingle();

  if (eventError?.code === "23505") {
    return NextResponse.json({ ok: true });
  }

  if (eventError) {
    return NextResponse.json(
      { code: "WEBHOOK_EVENT_STORE_FAILED" },
      { status: 500 },
    );
  }

  const typedEvent = event as ChargeOrderEventRow | null;

  if (!typedEvent) {
    return NextResponse.json({ ok: true });
  }

  if (eventType !== "PAYMENT_STATUS_CHANGED") {
    await updateWebhookEvent(admin, typedEvent.id, "ignored");
    return NextResponse.json({ ok: true });
  }

  if (!typedOrder) {
    await updateWebhookEvent(admin, typedEvent.id, "order_not_found");
    return NextResponse.json({ ok: true });
  }

  const paymentStatus =
    typeof data.status === "string" ? data.status : "UNKNOWN";

  if (
    paymentStatus === "DONE" &&
    typeof data.paymentKey === "string" &&
    typeof data.totalAmount === "number"
  ) {
    const { error } = await admin.rpc("approve_cash_charge_order", {
      p_order_id: orderId,
      p_provider_snapshot: payload,
      p_toss_payment_key: data.paymentKey,
    });

    if (error) {
      await admin
        .from("cash_charge_orders")
        .update({
          last_error_code: "WEBHOOK_APPROVE_FAILED",
          last_error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", typedOrder.id);
      await updateWebhookEvent(admin, typedEvent.id, "approve_failed");

      return NextResponse.json({ ok: true });
    }

    await admin
      .from("cash_charge_orders")
      .update({
        failure_code: null,
        failure_message: null,
        last_error_code: null,
        last_error_message: null,
      })
      .eq("id", typedOrder.id);
    await updateWebhookEvent(admin, typedEvent.id, "approved");

    return NextResponse.json({ ok: true });
  }

  if (typedOrder.status === "pending" && paymentStatus === "EXPIRED") {
    await admin
      .from("cash_charge_orders")
      .update({
        last_error_code: "PAYMENT_EXPIRED",
        last_error_message: "결제 승인 시간 내에 완료되지 않아 주문이 만료되었습니다.",
        status: "expired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", typedOrder.id);
    await updateWebhookEvent(admin, typedEvent.id, "expired");

    return NextResponse.json({ ok: true });
  }

  if (
    typedOrder.status === "pending" &&
    (paymentStatus === "ABORTED" || paymentStatus === "CANCELED")
  ) {
    await admin
      .from("cash_charge_orders")
      .update({
        failure_code: paymentStatus,
        failure_message: "결제 상태가 실패 또는 취소로 변경되었습니다.",
        last_error_code: paymentStatus,
        last_error_message: "결제 상태가 실패 또는 취소로 변경되었습니다.",
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", typedOrder.id);
    await updateWebhookEvent(admin, typedEvent.id, "failed");

    return NextResponse.json({ ok: true });
  }

  await updateWebhookEvent(admin, typedEvent.id, `ignored:${paymentStatus}`);
  return NextResponse.json({ ok: true });
}

async function updateWebhookEvent(
  admin: any,
  eventId: string,
  processedResult: string,
) {
  await admin
    .from("cash_charge_order_events")
    .update({
      processed_result: processedResult,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
