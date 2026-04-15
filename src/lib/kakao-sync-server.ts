import "server-only";

import {
  normalizeBirthDate,
  normalizeProfileGender,
  type ProfileGender,
} from "@/lib/signup-profile";

type KakaoServiceTermAgreement = {
  agreed: boolean;
  agreedAt: string | null;
  required: boolean;
  tag: string;
};

type KakaoSyncedProfile = {
  birthDate: string | null;
  gender: ProfileGender | null;
  legalName: string | null;
};

export async function fetchKakaoSyncedProfile(
  providerToken: string,
): Promise<KakaoSyncedProfile | null> {
  const payload = await fetchKakaoJson(
    "https://kapi.kakao.com/v2/user/me",
    providerToken,
  );

  if (!payload) {
    return null;
  }

  const kakaoAccount = asRecord(payload.kakao_account);

  return {
    birthDate: buildBirthDate(
      readTrimmedString(kakaoAccount?.birthyear),
      readTrimmedString(kakaoAccount?.birthday),
    ),
    gender: normalizeProfileGender(kakaoAccount?.gender),
    legalName: readTrimmedString(kakaoAccount?.name),
  };
}

export async function fetchKakaoServiceTermAgreements(
  providerToken: string,
): Promise<KakaoServiceTermAgreement[]> {
  const payload = await fetchKakaoJson(
    "https://kapi.kakao.com/v2/user/service_terms?result=app_service_terms",
    providerToken,
  );

  if (!payload) {
    return [];
  }

  const rows = [
    ...readAgreementRows(payload.service_terms),
    ...readAgreementRows(payload.app_service_terms),
  ];
  const seenTags = new Set<string>();

  return rows.filter((row) => {
    if (seenTags.has(row.tag)) {
      return false;
    }

    seenTags.add(row.tag);
    return true;
  });
}

async function fetchKakaoJson(url: string, providerToken: string) {
  if (!providerToken.trim()) {
    return null;
  }

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${providerToken}`,
      "Content-Type": "application/json",
    },
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

function readAgreementRows(value: unknown): KakaoServiceTermAgreement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((row) => {
      const record = asRecord(row);
      const tag = readTrimmedString(record?.tag);

      if (!tag) {
        return null;
      }

      return {
        agreed: Boolean(record?.agreed),
        agreedAt: readTrimmedString(record?.agreed_at),
        required: Boolean(record?.required),
        tag,
      } satisfies KakaoServiceTermAgreement;
    })
    .filter((row): row is KakaoServiceTermAgreement => Boolean(row));
}

function buildBirthDate(
  birthYear: string | null,
  birthday: string | null,
) {
  if (!birthYear || !birthday || !/^\d{4}$/.test(birthYear) || !/^\d{4}$/.test(birthday)) {
    return null;
  }

  return normalizeBirthDate(
    `${birthYear}-${birthday.slice(0, 2)}-${birthday.slice(2)}`,
  );
}

function readTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as Record<string, unknown>;
}
