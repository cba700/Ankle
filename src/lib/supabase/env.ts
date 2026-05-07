type SupabasePublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type SupabaseServiceEnv = SupabasePublicEnv & {
  serviceRoleKey: string;
};

type TossPaymentsPublicEnv = {
  clientKey: string;
};

type TossPaymentsServerEnv = TossPaymentsPublicEnv & {
  secretKey: string;
};

type SolapiServerEnv = {
  apiKey: string;
  apiSecret: string;
  senderPhone: string;
};

type SolapiKakaoTemplateEnv = {
  cashCharged: string | null;
  cashRefundProcessed: string | null;
  matchApplied: string | null;
  matchCancelledAdmin: string | null;
  matchCancelledUser: string | null;
  matchConfirmed: string | null;
  matchReminderDayBefore: string | null;
  matchReminderSameDay: string | null;
  noShowNotice: string | null;
  participantShortageNoticeDayBefore: string | null;
  participantShortageNoticeSameDay: string | null;
  rainChangeNotice: string | null;
  rainNotice: string | null;
  rainAlert: string | null;
  rainMatchCancelled: string | null;
};

type SolapiKakaoEnv = SolapiServerEnv & {
  kakaoChannelId: string;
  templates: SolapiKakaoTemplateEnv;
};

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function getSupabaseServiceEnv(): SupabaseServiceEnv | null {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!publicEnv || !serviceRoleKey) {
    return null;
  }

  return {
    ...publicEnv,
    serviceRoleKey,
  };
}

export function getTossPaymentsPublicEnv(): TossPaymentsPublicEnv | null {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

  if (!clientKey) {
    return null;
  }

  return {
    clientKey,
  };
}

export function getTossPaymentsServerEnv(): TossPaymentsServerEnv | null {
  const publicEnv = getTossPaymentsPublicEnv();
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!publicEnv || !secretKey) {
    return null;
  }

  return {
    ...publicEnv,
    secretKey,
  };
}

export function getSolapiServerEnv(): SolapiServerEnv | null {
  const apiKey = process.env.SOLAPI_API_KEY?.trim();
  const apiSecret = process.env.SOLAPI_API_SECRET?.trim();
  const senderPhone = process.env.SOLAPI_SENDER_PHONE?.trim();

  if (!apiKey || !apiSecret || !senderPhone) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    senderPhone,
  };
}

export function getSolapiKakaoEnv(): SolapiKakaoEnv | null {
  const serverEnv = getSolapiServerEnv();
  const kakaoChannelId = process.env.SOLAPI_KAKAO_CHANNEL_ID?.trim();

  if (!serverEnv || !kakaoChannelId) {
    return null;
  }

  return {
    ...serverEnv,
    kakaoChannelId,
    templates: {
      cashCharged: process.env.SOLAPI_KAKAO_TEMPLATE_CASH_CHARGED?.trim() ?? null,
      cashRefundProcessed:
        process.env.SOLAPI_KAKAO_TEMPLATE_CASH_REFUND_PROCESSED?.trim() ?? null,
      matchApplied: process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_APPLIED?.trim() ?? null,
      matchCancelledAdmin:
        process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_CANCELLED_ADMIN?.trim() ?? null,
      matchCancelledUser:
        process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_CANCELLED_USER?.trim() ?? null,
      matchConfirmed:
        process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_CONFIRMED?.trim() ?? null,
      matchReminderDayBefore:
        process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_REMINDER_DAY_BEFORE?.trim() ?? null,
      matchReminderSameDay:
        process.env.SOLAPI_KAKAO_TEMPLATE_MATCH_REMINDER_SAME_DAY?.trim() ?? null,
      noShowNotice: process.env.SOLAPI_KAKAO_TEMPLATE_NO_SHOW_NOTICE?.trim() ?? null,
      participantShortageNoticeDayBefore:
        process.env.SOLAPI_KAKAO_TEMPLATE_PARTICIPANT_SHORTAGE_NOTICE_DAY_BEFORE?.trim() ??
        null,
      participantShortageNoticeSameDay:
        process.env.SOLAPI_KAKAO_TEMPLATE_PARTICIPANT_SHORTAGE_NOTICE_SAME_DAY?.trim() ??
        null,
      rainChangeNotice:
        process.env.SOLAPI_KAKAO_TEMPLATE_RAIN_CHANGE_NOTICE?.trim() ?? null,
      rainNotice: process.env.SOLAPI_KAKAO_TEMPLATE_RAIN_NOTICE?.trim() ?? null,
      rainAlert: process.env.SOLAPI_KAKAO_TEMPLATE_RAIN_ALERT?.trim() ?? null,
      rainMatchCancelled:
        process.env.SOLAPI_KAKAO_TEMPLATE_RAIN_MATCH_CANCELLED?.trim() ?? null,
    },
  };
}

export function getPhoneVerificationSecret() {
  return (
    process.env.PHONE_VERIFICATION_SECRET?.trim() ??
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    null
  );
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicEnv());
}

export function isTossPaymentsConfigured() {
  return Boolean(getTossPaymentsServerEnv());
}

export function isSolapiConfigured() {
  return Boolean(getSolapiServerEnv());
}
