import "server-only";

import {
  addDays,
  formatMoney,
  formatSeoulDateInput,
  formatSeoulDateShortLabel,
  formatSeoulTime,
} from "@/lib/date";
import { normalizeKoreanMobilePhoneNumber } from "@/lib/phone-number";
import {
  cancelSolapiScheduledGroupMessage,
  sendSolapiKakao,
} from "@/lib/solapi";
import { getSolapiKakaoEnv } from "@/lib/supabase/env";
import { assertNotificationDispatchSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type NotificationEventType =
  | "cash_charged"
  | "match_confirmed"
  | "match_cancelled_user"
  | "match_cancelled_admin"
  | "match_reminder_day_before"
  | "match_reminder_same_day"
  | "no_show_notice";

type NotificationDispatchStatus =
  | "queued"
  | "scheduled"
  | "sent"
  | "cancelled"
  | "failed"
  | "skipped";

type NotificationTemplateKey =
  | "cashCharged"
  | "matchCancelledAdmin"
  | "matchCancelledUser"
  | "matchConfirmed"
  | "matchReminderDayBefore"
  | "matchReminderSameDay"
  | "noShowNotice";

type NotificationDispatchRow = {
  application_id: string | null;
  dedupe_key: string;
  id: string;
  provider_group_id: string | null;
  scheduled_for: string | null;
  status: NotificationDispatchStatus;
};

type MatchRelation = {
  address: string | null;
  end_at: string | null;
  id: string;
  start_at: string | null;
  title: string | null;
  venue_name: string | null;
};

type ApplicationNotificationRow = {
  charged_amount_snapshot: number;
  coupon_discount_amount: number;
  id: string;
  match: MatchRelation | MatchRelation[] | null;
  match_id: string;
  price_snapshot: number;
  refunded_amount: number;
  status: string;
  user_id: string | null;
};

type ChargeOrderNotificationRow = {
  amount: number;
  id: string;
  order_id: string;
  user_id: string;
};

type ProfileNotificationRow = {
  display_name: string | null;
  phone_number_e164: string | null;
  phone_verified_at: string | null;
};

type NotificationApplicationContext = {
  application: ApplicationNotificationRow;
  match: MatchRelation | null;
  profile: ProfileNotificationRow | null;
};

type ReminderKind = "day_before" | "same_day";

const REMINDER_EVENT_BY_KIND: Record<ReminderKind, NotificationEventType> = {
  day_before: "match_reminder_day_before",
  same_day: "match_reminder_same_day",
};

const TEMPLATE_KEY_BY_EVENT: Record<NotificationEventType, NotificationTemplateKey> = {
  cash_charged: "cashCharged",
  match_cancelled_admin: "matchCancelledAdmin",
  match_cancelled_user: "matchCancelledUser",
  match_confirmed: "matchConfirmed",
  match_reminder_day_before: "matchReminderDayBefore",
  match_reminder_same_day: "matchReminderSameDay",
  no_show_notice: "noShowNotice",
};

type NotificationAdminClient = NonNullable<
  ReturnType<typeof getSupabaseServiceRoleClient>
>;

export async function sendCashChargedNotification({
  amount,
  chargeOrderId,
  orderId,
  remainingCash,
  userId,
}: {
  amount: number;
  chargeOrderId: string;
  orderId: string;
  remainingCash: number;
  userId: string;
}) {
  await runNotificationTask("cash_charged", async (admin) => {
    const profile = await getProfileByUserId(admin, userId);

    await sendImmediateKakaoNotification(admin, {
      applicationId: null,
      chargeOrderId,
      dedupeKey: `cash_charge_paid:${orderId}`,
      eventType: "cash_charged",
      matchId: null,
      payload: {
        amount,
        orderId,
        remainingCash,
      },
      phoneNumberE164: getVerifiedPhoneNumber(profile),
      templateVariables: {
        "#{보유캐시}": `${formatMoney(remainingCash)}원`,
        "#{충전금액}": `${formatMoney(amount)}원`,
        "#{회원명}": getDisplayName(profile),
      },
      userId,
    });
  });
}

export async function sendMatchConfirmedNotification(applicationId: string) {
  await runNotificationTask("match_confirmed", async (admin) => {
    const context = await getApplicationContext(admin, applicationId);

    if (!context || !context.match) {
      return;
    }

    await sendImmediateKakaoNotification(admin, {
      applicationId,
      chargeOrderId: null,
      dedupeKey: `match_confirmed:${applicationId}`,
      eventType: "match_confirmed",
      matchId: context.application.match_id,
      payload: {
        chargedAmount: context.application.charged_amount_snapshot,
        couponDiscountAmount: context.application.coupon_discount_amount,
        matchTitle: context.match.title,
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      templateVariables: {
        ...buildMatchTemplateVariables(context),
        "#{차감금액}": `${formatMoney(context.application.charged_amount_snapshot)}원`,
        "#{쿠폰할인금액}": `${formatMoney(context.application.coupon_discount_amount)}원`,
      },
      userId: context.application.user_id,
    });
  });
}

export async function sendUserMatchCancelledNotification(applicationId: string) {
  await runNotificationTask("match_cancelled_user", async (admin) => {
    const context = await getApplicationContext(admin, applicationId);

    if (!context || !context.match) {
      return;
    }

    await sendImmediateKakaoNotification(admin, {
      applicationId,
      chargeOrderId: null,
      dedupeKey: `match_cancelled_user:${applicationId}`,
      eventType: "match_cancelled_user",
      matchId: context.application.match_id,
      payload: {
        refundedAmount: context.application.refunded_amount,
        status: context.application.status,
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      templateVariables: {
        ...buildMatchTemplateVariables(context),
        "#{환불금액}": `${formatMoney(context.application.refunded_amount)}원`,
      },
      userId: context.application.user_id,
    });
  });
}

export async function sendAdminMatchCancelledNotification(applicationId: string) {
  await runNotificationTask("match_cancelled_admin", async (admin) => {
    const context = await getApplicationContext(admin, applicationId);

    if (!context || !context.match) {
      return;
    }

    await sendImmediateKakaoNotification(admin, {
      applicationId,
      chargeOrderId: null,
      dedupeKey: `match_cancelled_admin:${applicationId}`,
      eventType: "match_cancelled_admin",
      matchId: context.application.match_id,
      payload: {
        refundedAmount: context.application.refunded_amount,
        status: context.application.status,
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      templateVariables: {
        ...buildMatchTemplateVariables(context),
        "#{환불금액}": `${formatMoney(context.application.refunded_amount)}원`,
      },
      userId: context.application.user_id,
    });
  });
}

export async function refreshMatchReminderNotifications(applicationId: string) {
  await runNotificationTask("match_reminder", async (admin) => {
    const context = await getApplicationContext(admin, applicationId);

    if (!context || !context.match || context.application.status !== "confirmed") {
      return;
    }

    await Promise.all([
      scheduleReminderDispatch(admin, context, "day_before"),
      scheduleReminderDispatch(admin, context, "same_day"),
    ]);
  });
}

export async function cancelMatchReminderNotifications(applicationId: string) {
  await runNotificationTask("cancel_match_reminders", async (admin) => {
    await Promise.all([
      cancelReminderDispatch(admin, `match_reminder_day_before:${applicationId}`),
      cancelReminderDispatch(admin, `match_reminder_same_day:${applicationId}`),
    ]);
  });
}

export async function sendNoShowNoticeNotification(applicationId: string) {
  await runNotificationTask("no_show_notice", async (admin) => {
    const context = await getApplicationContext(admin, applicationId);

    if (!context || !context.match) {
      return;
    }

    await sendImmediateKakaoNotification(admin, {
      applicationId,
      chargeOrderId: null,
      dedupeKey: `no_show_notice:${applicationId}`,
      eventType: "no_show_notice",
      matchId: context.application.match_id,
      payload: {
        status: context.application.status,
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      templateVariables: buildMatchTemplateVariables(context),
      userId: context.application.user_id,
      allowRetry: true,
    });
  });
}

export async function listSentApplicationNotificationIds(
  applicationIds: string[],
  eventType: NotificationEventType,
) {
  const admin = getSupabaseServiceRoleClient() as NotificationAdminClient | null;

  if (!admin || applicationIds.length === 0) {
    return new Set<string>();
  }

  try {
    await assertNotificationDispatchSchemaReady(admin);

    const { data, error } = await ((admin.from(
      "notification_dispatches" as any,
    ) as any)
      .select("application_id")
      .eq("event_type", eventType)
      .eq("status", "sent")
      .in("application_id", applicationIds));

    if (error) {
      throw new Error(`Failed to load notification dispatches: ${error.message}`);
    }

    return new Set(
      ((data ?? []) as { application_id: string | null }[])
        .map((row) => row.application_id)
        .filter((applicationId): applicationId is string => Boolean(applicationId)),
    );
  } catch (error) {
    console.error("[notifications] Failed to load sent notification ids", error);
    return new Set<string>();
  }
}

async function runNotificationTask(
  taskName: string,
  task: (admin: NotificationAdminClient) => Promise<void>,
) {
  const admin = getSupabaseServiceRoleClient() as NotificationAdminClient | null;

  if (!admin) {
    return;
  }

  try {
    await assertNotificationDispatchSchemaReady(admin);
    await task(admin);
  } catch (error) {
    console.error(`[notifications] ${taskName} failed`, error);
  }
}

async function sendImmediateKakaoNotification(
  admin: NotificationAdminClient,
  {
    allowRetry = false,
    applicationId,
    chargeOrderId,
    dedupeKey,
    eventType,
    matchId,
    payload,
    phoneNumberE164,
    templateVariables,
    userId,
  }: {
    allowRetry?: boolean;
    applicationId: string | null;
    chargeOrderId: string | null;
    dedupeKey: string;
    eventType: NotificationEventType;
    matchId: string | null;
    payload: Record<string, unknown>;
    phoneNumberE164: string | null;
    templateVariables: Record<string, string>;
    userId: string | null;
  },
) {
  const dispatch = await createOrReuseDispatch(admin, {
    allowRetry,
    applicationId,
    chargeOrderId,
    dedupeKey,
    eventType,
    matchId,
    payload,
    phoneNumberE164,
    userId,
  });

  if (!dispatch.shouldSend) {
    return;
  }

  const env = getSolapiKakaoEnv();
  const templateId = getTemplateId(eventType);
  const localPhoneNumber = toSolapiPhoneNumber(phoneNumberE164);

  if (!env) {
    await updateDispatch(admin, dedupeKey, {
      errorCode: "SOLAPI_KAKAO_NOT_CONFIGURED",
      errorMessage: "카카오 알림톡 설정이 완료되지 않았습니다.",
      payload,
      status: "skipped",
    });
    return;
  }

  if (!templateId) {
    await updateDispatch(admin, dedupeKey, {
      errorCode: "KAKAO_TEMPLATE_NOT_CONFIGURED",
      errorMessage: "카카오 알림톡 템플릿이 설정되지 않았습니다.",
      payload,
      status: "skipped",
    });
    return;
  }

  if (!localPhoneNumber) {
    await updateDispatch(admin, dedupeKey, {
      errorCode: "PHONE_NUMBER_NOT_AVAILABLE",
      errorMessage: "발송 가능한 휴대폰 번호가 없습니다.",
      payload,
      status: "skipped",
    });
    return;
  }

  const sendResult = await sendSolapiKakao({
    templateId,
    to: localPhoneNumber,
    variables: templateVariables,
  });

  if (!sendResult.ok) {
    await updateDispatch(admin, dedupeKey, {
      errorCode: sendResult.code,
      errorMessage: sendResult.message,
      payload: {
        ...payload,
        templateId,
        templateVariables,
      },
      status: "failed",
    });
    return;
  }

  await updateDispatch(admin, dedupeKey, {
    errorCode: null,
    errorMessage: null,
    payload: {
      ...payload,
      templateId,
      templateVariables,
    },
    providerGroupId: sendResult.vendorMessageId,
    sentAt: new Date().toISOString(),
    status: "sent",
  });
}

async function scheduleReminderDispatch(
  admin: NotificationAdminClient,
  context: NotificationApplicationContext,
  reminderKind: ReminderKind,
) {
  const eventType = REMINDER_EVENT_BY_KIND[reminderKind];
  const dedupeKey = `${eventType}:${context.application.id}`;
  const payload = {
    reminderKind,
    matchTitle: context.match?.title ?? null,
  };
  const existingDispatch = await getDispatchByDedupeKey(admin, dedupeKey);
  const scheduledAt = getReminderScheduleAt(
    context.match?.start_at ?? null,
    reminderKind,
  );

  if (!scheduledAt) {
    await upsertDispatch(admin, {
      applicationId: context.application.id,
      chargeOrderId: null,
      dedupeKey,
      eventType,
      matchId: context.application.match_id,
      payload,
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      status: "skipped",
      userId: context.application.user_id,
    });
    return;
  }

  if (existingDispatch?.status === "sent") {
    return;
  }

  if (existingDispatch?.status === "scheduled" && existingDispatch.provider_group_id) {
    const cancelResult = await cancelSolapiScheduledGroupMessage(
      existingDispatch.provider_group_id,
    );

    if (!cancelResult.ok) {
      console.error("[notifications] Failed to cancel scheduled reminder", {
        dedupeKey,
        errorCode: cancelResult.code,
        errorMessage: cancelResult.message,
      });
    }
  }

  if (scheduledAt.getTime() <= Date.now()) {
    await upsertDispatch(admin, {
      applicationId: context.application.id,
      cancelledAt: null,
      chargeOrderId: null,
      dedupeKey,
      errorCode: "REMINDER_WINDOW_PASSED",
      errorMessage: "이미 지난 리마인더 시점입니다.",
      eventType,
      matchId: context.application.match_id,
      payload: {
        ...payload,
        scheduledAt: scheduledAt.toISOString(),
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      providerGroupId: null,
      scheduledFor: scheduledAt.toISOString(),
      status: "skipped",
      userId: context.application.user_id,
    });
    return;
  }

  const templateId = getTemplateId(eventType);
  const localPhoneNumber = toSolapiPhoneNumber(getVerifiedPhoneNumber(context.profile));

  if (!templateId || !localPhoneNumber || !getSolapiKakaoEnv()) {
    await upsertDispatch(admin, {
      applicationId: context.application.id,
      cancelledAt: null,
      chargeOrderId: null,
      dedupeKey,
      errorCode: !getSolapiKakaoEnv()
        ? "SOLAPI_KAKAO_NOT_CONFIGURED"
        : !templateId
          ? "KAKAO_TEMPLATE_NOT_CONFIGURED"
          : "PHONE_NUMBER_NOT_AVAILABLE",
      errorMessage: !getSolapiKakaoEnv()
        ? "카카오 알림톡 설정이 완료되지 않았습니다."
        : !templateId
          ? "카카오 알림톡 템플릿이 설정되지 않았습니다."
          : "발송 가능한 휴대폰 번호가 없습니다.",
      eventType,
      matchId: context.application.match_id,
      payload: {
        ...payload,
        scheduledAt: scheduledAt.toISOString(),
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      providerGroupId: null,
      scheduledFor: scheduledAt.toISOString(),
      status: "skipped",
      userId: context.application.user_id,
    });
    return;
  }

  const templateVariables = buildMatchTemplateVariables(context);
  const sendResult = await sendSolapiKakao({
    scheduledDate: scheduledAt.toISOString(),
    templateId,
    to: localPhoneNumber,
    variables: templateVariables,
  });

  if (!sendResult.ok) {
    await upsertDispatch(admin, {
      applicationId: context.application.id,
      cancelledAt: null,
      chargeOrderId: null,
      dedupeKey,
      errorCode: sendResult.code,
      errorMessage: sendResult.message,
      eventType,
      matchId: context.application.match_id,
      payload: {
        ...payload,
        scheduledAt: scheduledAt.toISOString(),
        templateId,
        templateVariables,
      },
      phoneNumberE164: getVerifiedPhoneNumber(context.profile),
      providerGroupId: null,
      scheduledFor: scheduledAt.toISOString(),
      status: "failed",
      userId: context.application.user_id,
    });
    return;
  }

  await upsertDispatch(admin, {
    applicationId: context.application.id,
    cancelledAt: null,
    chargeOrderId: null,
    dedupeKey,
    errorCode: null,
    errorMessage: null,
    eventType,
    matchId: context.application.match_id,
    payload: {
      ...payload,
      scheduledAt: scheduledAt.toISOString(),
      templateId,
      templateVariables,
    },
    phoneNumberE164: getVerifiedPhoneNumber(context.profile),
    providerGroupId: sendResult.vendorMessageId,
    scheduledFor: scheduledAt.toISOString(),
    sentAt: null,
    status: "scheduled",
    userId: context.application.user_id,
  });
}

async function cancelReminderDispatch(
  admin: NotificationAdminClient,
  dedupeKey: string,
) {
  const dispatch = await getDispatchByDedupeKey(admin, dedupeKey);

  if (!dispatch || dispatch.status !== "scheduled") {
    return;
  }

  if (dispatch.provider_group_id) {
    const cancelResult = await cancelSolapiScheduledGroupMessage(
      dispatch.provider_group_id,
    );

    if (!cancelResult.ok) {
      await updateDispatch(admin, dedupeKey, {
        errorCode: cancelResult.code,
        errorMessage: cancelResult.message,
        status: "failed",
      });
      return;
    }
  }

  await updateDispatch(admin, dedupeKey, {
    cancelledAt: new Date().toISOString(),
    errorCode: null,
    errorMessage: null,
    providerGroupId: null,
    status: "cancelled",
  });
}

async function getApplicationContext(
  admin: NotificationAdminClient,
  applicationId: string,
) {
  const { data, error } = await admin
    .from("match_applications")
    .select(
      `id, user_id, match_id, status, refunded_amount, charged_amount_snapshot, coupon_discount_amount, price_snapshot, match:matches!match_applications_match_id_fkey (
        id,
        title,
        venue_name,
        address,
        start_at,
        end_at
      )`,
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load application notification context: ${error.message}`);
  }

  const application = (data ?? null) as ApplicationNotificationRow | null;

  if (!application?.user_id) {
    return null;
  }

  return {
    application,
    match: normalizeMatchRelation(application.match),
    profile: await getProfileByUserId(admin, application.user_id),
  } satisfies NotificationApplicationContext;
}

async function getProfileByUserId(
  admin: NotificationAdminClient,
  userId: string,
) {
  const { data, error } = await admin
    .from("profiles")
    .select("display_name, phone_number_e164, phone_verified_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile notification context: ${error.message}`);
  }

  return (data ?? null) as ProfileNotificationRow | null;
}

async function createOrReuseDispatch(
  admin: NotificationAdminClient,
  {
    allowRetry,
    applicationId,
    chargeOrderId,
    dedupeKey,
    eventType,
    matchId,
    payload,
    phoneNumberE164,
    userId,
  }: {
    allowRetry: boolean;
    applicationId: string | null;
    chargeOrderId: string | null;
    dedupeKey: string;
    eventType: NotificationEventType;
    matchId: string | null;
    payload: Record<string, unknown>;
    phoneNumberE164: string | null;
    userId: string | null;
  },
) {
  const { data, error } = await ((admin.from(
    "notification_dispatches" as any,
  ) as any)
    .insert({
      application_id: applicationId,
      charge_order_id: chargeOrderId,
      dedupe_key: dedupeKey,
      event_type: eventType,
      match_id: matchId,
      payload,
      phone_number_e164: phoneNumberE164,
      status: "queued",
      user_id: userId,
    })
    .select("id, dedupe_key, status, provider_group_id, scheduled_for, application_id")
    .maybeSingle());

  if (!error) {
    return {
      dispatch: data as NotificationDispatchRow | null,
      shouldSend: true,
    };
  }

  if (error.code !== "23505") {
    throw new Error(`Failed to create notification dispatch: ${error.message}`);
  }

  const existingDispatch = await getDispatchByDedupeKey(admin, dedupeKey);

  if (!existingDispatch) {
    throw new Error("Failed to load duplicate notification dispatch");
  }

  if (
    existingDispatch.status === "sent" ||
    existingDispatch.status === "scheduled" ||
    existingDispatch.status === "queued" ||
    !allowRetry
  ) {
    return {
      dispatch: existingDispatch,
      shouldSend: false,
    };
  }

  await updateDispatch(admin, dedupeKey, {
    applicationId,
    chargeOrderId,
    errorCode: null,
    errorMessage: null,
    matchId,
    payload,
    phoneNumberE164,
    providerGroupId: null,
    status: "queued",
    userId,
  });

  return {
    dispatch: existingDispatch,
    shouldSend: true,
  };
}

async function upsertDispatch(
  admin: NotificationAdminClient,
  {
    applicationId,
    cancelledAt,
    chargeOrderId,
    dedupeKey,
    errorCode,
    errorMessage,
    eventType,
    matchId,
    payload,
    phoneNumberE164,
    providerGroupId,
    scheduledFor,
    sentAt,
    status,
    userId,
  }: {
    applicationId: string | null;
    cancelledAt?: string | null;
    chargeOrderId: string | null;
    dedupeKey: string;
    errorCode?: string | null;
    errorMessage?: string | null;
    eventType: NotificationEventType;
    matchId: string | null;
    payload: Record<string, unknown>;
    phoneNumberE164: string | null;
    providerGroupId?: string | null;
    scheduledFor?: string | null;
    sentAt?: string | null;
    status: NotificationDispatchStatus;
    userId: string | null;
  },
) {
  const { error } = await ((admin.from("notification_dispatches" as any) as any).upsert(
    {
      application_id: applicationId,
      cancelled_at: cancelledAt ?? null,
      charge_order_id: chargeOrderId,
      dedupe_key: dedupeKey,
      error_code: errorCode ?? null,
      error_message: errorMessage ?? null,
      event_type: eventType,
      match_id: matchId,
      payload,
      phone_number_e164: phoneNumberE164,
      provider_group_id: providerGroupId ?? null,
      scheduled_for: scheduledFor ?? null,
      sent_at: sentAt ?? null,
      status,
      user_id: userId,
    },
    { onConflict: "dedupe_key" },
  ));

  if (error) {
    throw new Error(`Failed to upsert notification dispatch: ${error.message}`);
  }
}

async function updateDispatch(
  admin: NotificationAdminClient,
  dedupeKey: string,
  {
    applicationId,
    cancelledAt,
    chargeOrderId,
    errorCode,
    errorMessage,
    matchId,
    payload,
    phoneNumberE164,
    providerGroupId,
    scheduledFor,
    sentAt,
    status,
    userId,
  }: {
    applicationId?: string | null;
    cancelledAt?: string | null;
    chargeOrderId?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    matchId?: string | null;
    payload?: Record<string, unknown>;
    phoneNumberE164?: string | null;
    providerGroupId?: string | null;
    scheduledFor?: string | null;
    sentAt?: string | null;
    status: NotificationDispatchStatus;
    userId?: string | null;
  },
) {
  const updatePayload: Record<string, unknown> = {
    status,
  };

  if (applicationId !== undefined) {
    updatePayload.application_id = applicationId;
  }

  if (cancelledAt !== undefined) {
    updatePayload.cancelled_at = cancelledAt;
  }

  if (chargeOrderId !== undefined) {
    updatePayload.charge_order_id = chargeOrderId;
  }

  if (errorCode !== undefined) {
    updatePayload.error_code = errorCode;
  }

  if (errorMessage !== undefined) {
    updatePayload.error_message = errorMessage;
  }

  if (matchId !== undefined) {
    updatePayload.match_id = matchId;
  }

  if (payload !== undefined) {
    updatePayload.payload = payload;
  }

  if (phoneNumberE164 !== undefined) {
    updatePayload.phone_number_e164 = phoneNumberE164;
  }

  if (providerGroupId !== undefined) {
    updatePayload.provider_group_id = providerGroupId;
  }

  if (scheduledFor !== undefined) {
    updatePayload.scheduled_for = scheduledFor;
  }

  if (sentAt !== undefined) {
    updatePayload.sent_at = sentAt;
  }

  if (userId !== undefined) {
    updatePayload.user_id = userId;
  }

  const { error } = await ((admin.from("notification_dispatches" as any) as any)
    .update(updatePayload)
    .eq("dedupe_key", dedupeKey));

  if (error) {
    throw new Error(`Failed to update notification dispatch: ${error.message}`);
  }
}

async function getDispatchByDedupeKey(
  admin: NotificationAdminClient,
  dedupeKey: string,
) {
  const { data, error } = await ((admin.from(
    "notification_dispatches" as any,
  ) as any)
    .select("id, dedupe_key, status, provider_group_id, scheduled_for, application_id")
    .eq("dedupe_key", dedupeKey)
    .maybeSingle());

  if (error) {
    throw new Error(`Failed to load notification dispatch: ${error.message}`);
  }

  return (data ?? null) as NotificationDispatchRow | null;
}

function buildMatchTemplateVariables(context: NotificationApplicationContext) {
  return {
    "#{경기장명}": context.match?.venue_name?.trim() || "앵클 경기장",
    "#{경기장주소}": context.match?.address?.trim() || "-",
    "#{매치명}": context.match?.title?.trim() || "앵클 매치",
    "#{매치시간}": getMatchTimeLabel(context.match?.start_at ?? null, context.match?.end_at ?? null),
    "#{매치일}": getMatchDateLabel(context.match?.start_at ?? null),
    "#{회원명}": getDisplayName(context.profile),
  };
}

function getReminderScheduleAt(startAt: string | null, reminderKind: ReminderKind) {
  if (!startAt) {
    return null;
  }

  const startDate = new Date(startAt);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  if (reminderKind === "same_day") {
    return new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
  }

  const seoulDate = new Date(`${formatSeoulDateInput(startDate)}T00:00:00+09:00`);
  const previousDate = addDays(seoulDate, -1);

  return new Date(`${formatSeoulDateInput(previousDate)}T18:00:00+09:00`);
}

function getMatchDateLabel(startAt: string | null) {
  if (!startAt) {
    return "-";
  }

  const date = new Date(startAt);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return formatSeoulDateShortLabel(date);
}

function getMatchTimeLabel(startAt: string | null, endAt: string | null) {
  if (!startAt) {
    return "-";
  }

  const startDate = new Date(startAt);

  if (Number.isNaN(startDate.getTime())) {
    return "-";
  }

  const startTimeLabel = formatSeoulTime(startDate);

  if (!endAt) {
    return startTimeLabel;
  }

  const endDate = new Date(endAt);

  if (Number.isNaN(endDate.getTime())) {
    return startTimeLabel;
  }

  return `${startTimeLabel} - ${formatSeoulTime(endDate)}`;
}

function getDisplayName(profile: ProfileNotificationRow | null) {
  return profile?.display_name?.trim() || "회원";
}

function getVerifiedPhoneNumber(profile: ProfileNotificationRow | null) {
  if (!profile?.phone_verified_at) {
    return null;
  }

  return profile.phone_number_e164 ?? null;
}

function getTemplateId(eventType: NotificationEventType) {
  const env = getSolapiKakaoEnv();

  if (!env) {
    return null;
  }

  return env.templates[TEMPLATE_KEY_BY_EVENT[eventType]];
}

function toSolapiPhoneNumber(phoneNumberE164: string | null) {
  if (!phoneNumberE164) {
    return null;
  }

  return normalizeKoreanMobilePhoneNumber(phoneNumberE164)?.local ?? null;
}

function normalizeMatchRelation(match: MatchRelation | MatchRelation[] | null) {
  if (!match) {
    return null;
  }

  return Array.isArray(match) ? (match[0] ?? null) : match;
}
