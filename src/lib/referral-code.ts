export const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9]{5}$/;

export function normalizeReferralCode(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidReferralCodeFormat(value: string) {
  return REFERRAL_CODE_PATTERN.test(value);
}
