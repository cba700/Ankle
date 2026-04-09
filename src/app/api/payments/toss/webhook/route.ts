import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  finalizeTossChargeOrder,
  getChargeOrderByOrderId,
  getChargeOrderEventByProviderEventId,
  getWebhookPaymentKey,
  getWebhookPaymentStatus,
  reconcileApprovedTossChargeOrder,
  transitionPendingChargeOrderStatus,
} from "@/lib/payments/toss-charge";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type WebhookPayload = {
  data?: Record<string, unknown>;
  eventType?: unknown;
};

type ChargeOrderEventRow = {
  id: string;
  processed_result: string;
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

  const chargeOrder = await getChargeOrderByOrderId(admin, orderId);
  const storedEvent = await storeWebhookEvent(admin, {
    chargeOrderId: chargeOrder?.id ?? null,
    eventType,
    orderId,
    payload,
    providerEventId: transmissionId,
  });

  if (storedEvent.duplicate && !shouldRetryWebhookEvent(storedEvent.event.processed_result)) {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (eventType !== "PAYMENT_STATUS_CHANGED") {
    await updateWebhookEvent(admin, storedEvent.event.id, "logged");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (!chargeOrder) {
    await updateWebhookEvent(admin, storedEvent.event.id, "order_not_found");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  const paymentStatus = getWebhookPaymentStatus(payload) ?? "UNKNOWN";
  const paymentKey = getWebhookPaymentKey(payload);

  if (paymentStatus === "IN_PROGRESS") {
    if (!paymentKey) {
      await updateWebhookEvent(
        admin,
        storedEvent.event.id,
        "invalid_payload:missing_payment_key",
      );
      return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
    }

    const result = await finalizeTossChargeOrder(admin, {
      orderId,
      paymentKey,
    });

    return buildWebhookResultResponse(admin, storedEvent.event.id, result, {
      successProcessedResult:
        result.ok && result.source === "already_paid" ? "already_paid" : "approved",
    });
  }

  if (paymentStatus === "DONE") {
    if (!paymentKey) {
      await updateWebhookEvent(
        admin,
        storedEvent.event.id,
        "invalid_payload:missing_payment_key",
      );
      return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
    }

    const result = await reconcileApprovedTossChargeOrder(admin, {
      chargeOrder,
      paymentKey,
    });

    return buildWebhookResultResponse(admin, storedEvent.event.id, result, {
      successProcessedResult:
        result.ok && result.source === "already_paid" ? "already_paid" : "reconciled",
    });
  }

  if (paymentStatus === "EXPIRED") {
    await transitionPendingChargeOrderStatus(admin, chargeOrder, {
      errorCode: "TOSS_WEBHOOK_EXPIRED",
      errorMessage: "토스 결제 유효시간이 만료되었습니다.",
      providerSnapshot: payload,
      status: "expired",
    });
    await updateWebhookEvent(admin, storedEvent.event.id, "expired");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (paymentStatus === "CANCELED") {
    await transitionPendingChargeOrderStatus(admin, chargeOrder, {
      errorCode: "TOSS_WEBHOOK_CANCELLED",
      errorMessage: "토스 결제가 취소되었습니다.",
      providerSnapshot: payload,
      status: "cancelled",
    });
    await updateWebhookEvent(admin, storedEvent.event.id, "cancelled");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (paymentStatus === "ABORTED") {
    await transitionPendingChargeOrderStatus(admin, chargeOrder, {
      errorCode: "TOSS_WEBHOOK_ABORTED",
      errorMessage: "토스 결제가 중단되었습니다.",
      providerSnapshot: payload,
      status: "failed",
    });
    await updateWebhookEvent(admin, storedEvent.event.id, "aborted");
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  await updateWebhookEvent(admin, storedEvent.event.id, "logged");
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}

async function buildWebhookResultResponse(
  admin: any,
  eventId: string,
  result: Awaited<ReturnType<typeof finalizeTossChargeOrder>>,
  {
    successProcessedResult,
  }: {
    successProcessedResult: string;
  },
) {
  if (result.ok) {
    await updateWebhookEvent(admin, eventId, successProcessedResult);
    return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
  }

  if (result.retryable) {
    await updateWebhookEvent(admin, eventId, `retryable_error:${result.code}`);
    return NextResponse.json(
      { code: result.code },
      { headers: PRIVATE_NO_STORE_HEADERS, status: 500 },
    );
  }

  await updateWebhookEvent(admin, eventId, `error:${result.code}`);
  return NextResponse.json({ ok: true }, { headers: PRIVATE_NO_STORE_HEADERS });
}

async function storeWebhookEvent(
  admin: any,
  {
    chargeOrderId,
    eventType,
    orderId,
    payload,
    providerEventId,
  }: {
    chargeOrderId: string | null;
    eventType: string;
    orderId: string;
    payload: WebhookPayload;
    providerEventId: string;
  },
) {
  const { data, error } = await admin
    .from("cash_charge_order_events")
    .insert({
      charge_order_id: chargeOrderId,
      event_type: eventType,
      order_id: orderId,
      payload,
      processed_result: "received",
      processed_at: new Date().toISOString(),
      provider_event_id: providerEventId,
    })
    .select("id, processed_result")
    .maybeSingle();

  if (error?.code === "23505") {
    const existingEvent = await getChargeOrderEventByProviderEventId(admin, providerEventId);

    if (!existingEvent) {
      throw new Error("Failed to load duplicate webhook event");
    }

    return {
      duplicate: true,
      event: existingEvent,
    };
  }

  if (error) {
    throw new Error(`Failed to store webhook event: ${error.message}`);
  }

  const event = data as ChargeOrderEventRow | null;

  if (!event) {
    throw new Error("Webhook event insert returned no row");
  }

  return {
    duplicate: false,
    event,
  };
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

function shouldRetryWebhookEvent(processedResult: string) {
  return (
    processedResult === "received" ||
    processedResult.startsWith("retryable_error:")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
