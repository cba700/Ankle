export const SIGNUP_CONSENT_POLICY_VERSION = "2026-03-10";

export const SIGNUP_CONSENT_FIELD_TO_TYPE = {
  ageOver16: "age_over_16",
  marketingProfile: "marketing_profile",
  marketingSms: "marketing_sms",
  privacy: "privacy",
  terms: "terms",
} as const;

export const REQUIRED_SIGNUP_AGREEMENT_FIELDS = [
  "ageOver16",
  "privacy",
  "terms",
] as const;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 12;

const DISPLAY_NAME_ALLOWED_PATTERN = /^[A-Za-z0-9가-힣 ]+$/;

export type SignupAgreementField = keyof typeof SIGNUP_CONSENT_FIELD_TO_TYPE;
export type SignupConsentType =
  (typeof SIGNUP_CONSENT_FIELD_TO_TYPE)[SignupAgreementField];
export type ProfileGender = "female" | "male";

export type SignupAgreementValues = Record<SignupAgreementField, boolean>;

export function getDefaultSignupAgreementValues(): SignupAgreementValues {
  return {
    ageOver16: false,
    marketingProfile: false,
    marketingSms: false,
    privacy: false,
    terms: false,
  };
}

export function normalizeSignupAgreementValues(
  input: unknown,
): SignupAgreementValues {
  const defaults = getDefaultSignupAgreementValues();

  if (!input || typeof input !== "object") {
    return defaults;
  }

  const record = input as Record<string, unknown>;

  return {
    ageOver16: Boolean(record.ageOver16),
    marketingProfile: Boolean(record.marketingProfile),
    marketingSms: Boolean(record.marketingSms),
    privacy: Boolean(record.privacy),
    terms: Boolean(record.terms),
  };
}

export function areRequiredSignupAgreementsAccepted(
  agreements: SignupAgreementValues,
) {
  return REQUIRED_SIGNUP_AGREEMENT_FIELDS.every((field) => agreements[field]);
}

export function normalizeProfileGender(value: unknown): ProfileGender | null {
  return value === "female" || value === "male" ? value : null;
}

export function normalizeLegalName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

export function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

export function getDisplayNameValidationMessage(value: unknown) {
  const normalizedValue = normalizeDisplayName(value);

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue.length < DISPLAY_NAME_MIN_LENGTH ||
    normalizedValue.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    return `표시 이름은 ${DISPLAY_NAME_MIN_LENGTH}자 이상 ${DISPLAY_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`;
  }

  if (!DISPLAY_NAME_ALLOWED_PATTERN.test(normalizedValue)) {
    return "표시 이름에는 한글, 영문, 숫자, 공백만 사용할 수 있습니다.";
  }

  return null;
}

export function normalizeBirthDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return null;
  }

  const [yearString, monthString, dayString] = trimmedValue.split("-");
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);
  const day = Number.parseInt(dayString, 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const normalizedDate = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    normalizedDate.getUTCFullYear() !== year ||
    normalizedDate.getUTCMonth() !== month - 1 ||
    normalizedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmedValue;
}

export function isAtLeastAge(
  birthDate: string,
  age: number,
  now = new Date(),
) {
  const normalizedBirthDate = normalizeBirthDate(birthDate);

  if (!normalizedBirthDate) {
    return false;
  }

  const [yearString, monthString, dayString] = normalizedBirthDate.split("-");
  const birthYear = Number.parseInt(yearString, 10);
  const birthMonth = Number.parseInt(monthString, 10);
  const birthDay = Number.parseInt(dayString, 10);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  let calculatedAge = currentYear - birthYear;

  if (
    currentMonth < birthMonth ||
    (currentMonth === birthMonth && currentDay < birthDay)
  ) {
    calculatedAge -= 1;
  }

  return calculatedAge >= age;
}
