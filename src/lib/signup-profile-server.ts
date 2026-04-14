import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSignupCompleteHref } from "@/lib/auth/redirect";
import {
  fetchKakaoServiceTermAgreements,
  fetchKakaoSyncedProfile,
} from "@/lib/kakao-sync-server";
import {
  SIGNUP_CONSENT_FIELD_TO_TYPE,
  SIGNUP_CONSENT_POLICY_VERSION,
  areRequiredSignupAgreementsAccepted,
  getDefaultSignupAgreementValues,
  isAtLeastAge,
  type ProfileGender,
  type SignupAgreementField,
  type SignupAgreementValues,
  type SignupConsentType,
} from "@/lib/signup-profile";

type SignupProfileRow = {
  birth_date: string | null;
  display_name: string | null;
  gender: ProfileGender | null;
  legal_name: string | null;
  signup_profile_completed_at: string | null;
  signup_profile_required: boolean | null;
};

type SignupConsentRow = {
  consent_type: SignupConsentType | null;
  is_agreed: boolean | null;
};

export type SignupProfileState = {
  agreements: SignupAgreementValues;
  birthDate: string;
  displayName: string;
  gender: ProfileGender | null;
  isComplete: boolean;
  legalName: string;
  signupProfileCompletedAt: string | null;
  signupProfileRequired: boolean;
};

type SignupProfileClient = SupabaseClient<any, "public", any>;

const SIGNUP_PROFILE_SELECT = [
  "birth_date",
  "display_name",
  "gender",
  "legal_name",
  "signup_profile_completed_at",
  "signup_profile_required",
].join(", ");

const CONSENT_TYPE_TO_FIELD = Object.entries(SIGNUP_CONSENT_FIELD_TO_TYPE).reduce(
  (accumulator, [field, consentType]) => ({
    ...accumulator,
    [consentType]: field,
  }),
  {} as Record<SignupConsentType, SignupAgreementField>,
);

export async function getSignupProfileState(
  supabase: SignupProfileClient,
  userId: string,
): Promise<SignupProfileState> {
  const [{ data: profileRow, error: profileError }, { data: consentRows, error: consentError }] =
    await Promise.all([
      (supabase.from("profiles" as any) as any)
        .select(SIGNUP_PROFILE_SELECT)
        .eq("id", userId)
        .maybeSingle(),
      (supabase.from("profile_consents" as any) as any)
        .select("consent_type, is_agreed")
        .eq("user_id", userId)
        .eq("policy_version", SIGNUP_CONSENT_POLICY_VERSION),
    ]);

  if (profileError) {
    throw new Error(`Failed to load signup profile: ${profileError.message}`);
  }

  if (consentError) {
    throw new Error(`Failed to load profile consents: ${consentError.message}`);
  }

  const profile = (profileRow ?? null) as SignupProfileRow | null;
  const agreements = mergeConsentRows(
    ((consentRows ?? []) as SignupConsentRow[]),
  );
  const legalName = profile?.legal_name?.trim() ?? "";
  const birthDate = profile?.birth_date ?? "";
  const gender = profile?.gender ?? null;

  return {
    agreements,
    birthDate,
    displayName: profile?.display_name?.trim() ?? "",
    gender,
    isComplete: isSignupProfileComplete({
      agreements,
      birthDate,
      gender,
      legalName,
    }),
    legalName,
    signupProfileCompletedAt: profile?.signup_profile_completed_at ?? null,
    signupProfileRequired: Boolean(profile?.signup_profile_required),
  };
}

export function getRequiredSignupProfileHref(
  signupProfileState: SignupProfileState,
  nextPath?: string | null,
) {
  if (
    signupProfileState.signupProfileRequired &&
    !signupProfileState.isComplete
  ) {
    return buildSignupCompleteHref(nextPath);
  }

  return null;
}

export async function refreshSignupProfileCompletionStatus(
  supabase: SignupProfileClient,
  userId: string,
) {
  const signupProfileState = await getSignupProfileState(supabase, userId);

  if (!signupProfileState.signupProfileRequired || !signupProfileState.isComplete) {
    return signupProfileState;
  }

  const completedAt =
    signupProfileState.signupProfileCompletedAt ?? new Date().toISOString();
  const { error } = await (supabase.from("profiles" as any) as any)
    .update({
      signup_profile_completed_at: completedAt,
      signup_profile_required: false,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to refresh signup profile completion: ${error.message}`);
  }

  return {
    ...signupProfileState,
    signupProfileCompletedAt: completedAt,
    signupProfileRequired: false,
  };
}

export async function saveSignupProfileData(
  supabase: SignupProfileClient,
  {
    agreements,
    birthDate,
    gender,
    legalName,
    source,
    userId,
  }: {
    agreements: SignupAgreementValues;
    birthDate: string;
    gender: ProfileGender;
    legalName: string;
    source: string;
    userId: string;
  },
) {
  const currentState = await getSignupProfileState(supabase, userId);
  const completedAt = new Date().toISOString();
  const profileUpdatePayload: Record<string, unknown> = {
    birth_date: birthDate,
    gender,
    legal_name: legalName,
    signup_profile_completed_at: completedAt,
    signup_profile_required: false,
  };

  if (!currentState.displayName) {
    profileUpdatePayload.display_name = legalName;
  }

  await upsertProfileConsentValues(supabase, {
    agreements,
    source,
    userId,
  });

  const { error: profileError } = await (supabase.from("profiles" as any) as any)
    .update(profileUpdatePayload)
    .eq("id", userId);

  if (profileError) {
    throw new Error(`Failed to save signup profile: ${profileError.message}`);
  }

  return completedAt;
}

export async function syncKakaoSignupProfile(
  supabase: SignupProfileClient,
  {
    providerToken,
    userId,
  }: {
    providerToken: string;
    userId: string;
  },
) {
  const currentState = await getSignupProfileState(supabase, userId);
  const [kakaoProfile, kakaoServiceTerms] = await Promise.all([
    fetchKakaoSyncedProfile(providerToken),
    fetchKakaoServiceTermAgreements(providerToken),
  ]);
  const profileUpdates: Record<string, unknown> = {};

  if (!currentState.legalName && kakaoProfile?.legalName) {
    profileUpdates.legal_name = kakaoProfile.legalName;
  }

  if (!currentState.displayName && kakaoProfile?.legalName) {
    profileUpdates.display_name = kakaoProfile.legalName;
  }

  if (!currentState.birthDate && kakaoProfile?.birthDate) {
    profileUpdates.birth_date = kakaoProfile.birthDate;
  }

  if (!currentState.gender && kakaoProfile?.gender) {
    profileUpdates.gender = kakaoProfile.gender;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: profileError } = await (supabase.from("profiles" as any) as any)
      .update(profileUpdates)
      .eq("id", userId);

    if (profileError) {
      throw new Error(`Failed to sync Kakao profile data: ${profileError.message}`);
    }
  }

  const syncedAgreements = mapKakaoServiceTermsToAgreements(kakaoServiceTerms);

  if (syncedAgreements) {
    await upsertProfileConsentValues(supabase, {
      agreements: syncedAgreements,
      source: "kakao_sync",
      userId,
    });
  }

  return refreshSignupProfileCompletionStatus(supabase, userId);
}

async function upsertProfileConsentValues(
  supabase: SignupProfileClient,
  {
    agreements,
    source,
    userId,
  }: {
    agreements: Partial<SignupAgreementValues>;
    source: string;
    userId: string;
  },
) {
  const consentRows = Object.entries(agreements).map(([field, isAgreed]) => {
    const agreementField = field as SignupAgreementField;
    const agreed = Boolean(isAgreed);

    return {
      agreed_at: agreed ? new Date().toISOString() : null,
      consent_type: SIGNUP_CONSENT_FIELD_TO_TYPE[agreementField],
      is_agreed: agreed,
      is_required: isRequiredAgreementField(agreementField),
      policy_version: SIGNUP_CONSENT_POLICY_VERSION,
      source,
      user_id: userId,
    };
  });

  if (consentRows.length === 0) {
    return;
  }

  const { error } = await (supabase.from("profile_consents" as any) as any)
    .upsert(consentRows, {
      onConflict: "user_id,consent_type,policy_version",
    });

  if (error) {
    throw new Error(`Failed to save profile consents: ${error.message}`);
  }
}

function mergeConsentRows(rows: SignupConsentRow[]) {
  const agreements = getDefaultSignupAgreementValues();

  rows.forEach((row) => {
    if (!row.consent_type) {
      return;
    }

    const field = CONSENT_TYPE_TO_FIELD[row.consent_type];

    if (!field) {
      return;
    }

    agreements[field] = Boolean(row.is_agreed);
  });

  return agreements;
}

function mapKakaoServiceTermsToAgreements(
  agreements: Array<{
    agreed: boolean;
    tag: string;
  }>,
) {
  const nextAgreements: Partial<SignupAgreementValues> = {};

  agreements.forEach((agreement) => {
    const field = consentTypeToField(agreement.tag);

    if (!field) {
      return;
    }

    nextAgreements[field] = agreement.agreed;
  });

  return Object.keys(nextAgreements).length > 0 ? nextAgreements : null;
}

function consentTypeToField(value: string) {
  return (CONSENT_TYPE_TO_FIELD as Record<string, SignupAgreementField | undefined>)[
    value
  ] ?? null;
}

function isRequiredAgreementField(field: SignupAgreementField) {
  return field === "ageOver16" || field === "privacy" || field === "terms";
}

function isSignupProfileComplete({
  agreements,
  birthDate,
  gender,
  legalName,
}: {
  agreements: SignupAgreementValues;
  birthDate: string;
  gender: ProfileGender | null;
  legalName: string;
}) {
  return Boolean(
    legalName &&
      birthDate &&
      gender &&
      areRequiredSignupAgreementsAccepted(agreements) &&
      isAtLeastAge(birthDate, 16),
  );
}
