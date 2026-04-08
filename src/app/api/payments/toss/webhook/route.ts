import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type WebhookPayload = {
  data?: Record<string, unknown>;
  eventType?: unknown;
};

type ChargeOrderRow = {
  id: string;
  order_id: string;
};

type ChargeOrderEventRow = {
  id: string;
};

export async function POST(request: Request) {
  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    return NextResponse.json(
      { code: "SERVICE_ROLE_NOT_CONFIGURED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 503 },
    );
  }

  const payload = (await request.json().catch(() => null)) as WebhookPayload | null;

  if (!payload) {
    return NextResponse.json(
      { code: "INVALID_WEBHOOK_PAYLOAD" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 400 },
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
    .select("id, order_id")
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
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (eventError) {
    return NextResponse.json(
      { code: "WEBHOOK_EVENT_STORE_FAILED" },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
    );
  }

  const typedEvent = event as ChargeOrderEventRow | null;

  if (!typedEvent) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (eventType !== "PAYMENT_STATUS_CHANGED") {
    await updateWebhookEvent(admin, typedEvent.id, "logged");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (!typedOrder) {
    await updateWebhookEvent(admin, typedEvent.id, "order_not_found");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const paymentStatus =
    typeof data.status === "string" ? data.status : "UNKNOWN";

  await updateWebhookEvent(
    admin,
    typedEvent.id,
    getWebhookProcessedResult(paymentStatus),
  );

  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
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

function getWebhookProcessedResult(paymentStatus: string) {
  switch (paymentStatus) {
    case "DONE":
      return "ignored:done_unverified";
    case "EXPIRED":
      return "ignored:expired_unverified";
    case "ABORTED":
      return "ignored:aborted_unverified";
    case "CANCELED":
      return "ignored:cancelled_unverified";
    default:
      return "logged";
  }
}
