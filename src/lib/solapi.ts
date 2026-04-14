import "server-only";

import { createHmac, randomBytes } from "crypto";
import { getSolapiServerEnv } from "@/lib/supabase/env";

type SolapiSendParams = {
  text: string;
  to: string;
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

  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", env.apiSecret)
    .update(`${date}${salt}`)
    .digest("hex");

  const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      Authorization: `HMAC-SHA256 apiKey=${env.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          from: env.senderPhone,
          text,
          to,
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || (payload && typeof payload.errorCode === "string")) {
    return {
      code:
        typeof payload?.errorCode === "string" && payload.errorCode.trim()
          ? payload.errorCode
          : "SOLAPI_SEND_FAILED",
      message:
        typeof payload?.errorMessage === "string" && payload.errorMessage.trim()
          ? payload.errorMessage
          : "문자 발송에 실패했습니다.",
      ok: false,
    };
  }

  return {
    ok: true,
    vendorMessageId:
      typeof payload?.groupId === "string" && payload.groupId.trim()
        ? payload.groupId
        : null,
  };
}
