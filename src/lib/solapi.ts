import "server-only";

import { createHmac, randomBytes } from "crypto";
import {
  getSolapiKakaoEnv,
  getSolapiServerEnv,
} from "@/lib/supabase/env";

type SolapiSendParams = {
  text: string;
  to: string;
};

type SolapiKakaoSendParams = {
  scheduledDate?: string;
  templateId: string;
  to: string;
  variables?: Record<string, string>;
};

type SolapiSendResult =
  | {
      code: string;
      message: string;
      ok: false;
    }
  | {
      ok: true;
      vendorMessageId: string | null;
    };

type SolapiCancelResult =
  | {
      code: string;
      message: string;
      ok: false;
    }
  | {
      ok: true;
    };

export async function sendSolapiSms({
  text,
  to,
}: SolapiSendParams): Promise<SolapiSendResult> {
  const env = getSolapiServerEnv();

  if (!env) {
    return {
      code: "SOLAPI_NOT_CONFIGURED",
      message: "문자 발송 설정이 완료되지 않았습니다.",
      ok: false,
    };
  }

  return sendSolapiMessages(env, {
    messages: [
      {
        from: env.senderPhone,
        text,
        to,
      },
    ],
  });
}

export async function sendSolapiKakao({
  scheduledDate,
  templateId,
  to,
  variables = {},
}: SolapiKakaoSendParams): Promise<SolapiSendResult> {
  const env = getSolapiKakaoEnv();

  if (!env) {
    return {
      code: "SOLAPI_KAKAO_NOT_CONFIGURED",
      message: "카카오 알림톡 발송 설정이 완료되지 않았습니다.",
      ok: false,
    };
  }

  return sendSolapiMessages(env, {
    messages: [
      {
        from: env.senderPhone,
        to,
        type: "ATA",
        kakaoOptions: {
          pfId: env.kakaoChannelId,
          templateId,
          variables,
        },
      },
    ],
    scheduledDate,
  });
}

export async function cancelSolapiScheduledGroupMessage(
  groupId: string,
): Promise<SolapiCancelResult> {
  const env = getSolapiServerEnv();

  if (!env) {
    return {
      code: "SOLAPI_NOT_CONFIGURED",
      message: "문자 발송 설정이 완료되지 않았습니다.",
      ok: false,
    };
  }

  const response = await fetch(
    `https://api.solapi.com/messages/v4/groups/${encodeURIComponent(groupId)}/schedule`,
    {
      method: "DELETE",
      headers: buildSolapiHeaders(env),
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || (payload && typeof payload.errorCode === "string")) {
    return {
      code:
        typeof payload?.errorCode === "string" && payload.errorCode.trim()
          ? payload.errorCode
          : "SOLAPI_CANCEL_FAILED",
      message:
        typeof payload?.errorMessage === "string" && payload.errorMessage.trim()
          ? payload.errorMessage
          : "예약 발송 취소에 실패했습니다.",
      ok: false,
    };
  }

  return { ok: true };
}

async function sendSolapiMessages(
  env: NonNullable<ReturnType<typeof getSolapiServerEnv>>,
  payload: {
    messages: Record<string, unknown>[];
    scheduledDate?: string;
  },
): Promise<SolapiSendResult> {
  const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: buildSolapiHeaders(env),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responsePayload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || (responsePayload && typeof responsePayload.errorCode === "string")) {
    return {
      code:
        typeof responsePayload?.errorCode === "string" && responsePayload.errorCode.trim()
          ? responsePayload.errorCode
          : "SOLAPI_SEND_FAILED",
      message:
        typeof responsePayload?.errorMessage === "string" && responsePayload.errorMessage.trim()
          ? responsePayload.errorMessage
          : "메시지 발송에 실패했습니다.",
      ok: false,
    };
  }

  return {
    ok: true,
    vendorMessageId:
      typeof responsePayload?.groupId === "string" && responsePayload.groupId.trim()
        ? responsePayload.groupId
        : null,
  };
}

function buildSolapiHeaders(
  env: NonNullable<ReturnType<typeof getSolapiServerEnv>>,
) {
  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", env.apiSecret)
    .update(`${date}${salt}`)
    .digest("hex");

  return {
    Authorization: `HMAC-SHA256 apiKey=${env.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    "Content-Type": "application/json",
  };
}
