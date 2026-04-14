const KOREAN_MOBILE_NUMBER_PATTERN = /^01(?:0|1|[6-9])\d{7,8}$/;

export function normalizeKoreanMobilePhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const localDigits = toKoreanLocalMobileDigits(digits);

  if (!localDigits || !KOREAN_MOBILE_NUMBER_PATTERN.test(localDigits)) {
    return null;
  }

  return {
    e164: `+82${localDigits.slice(1)}`,
    local: localDigits,
  };
}

export function formatPhoneNumberForDisplay(phoneNumberE164: string | null | undefined) {
  if (!phoneNumberE164) {
    return "미인증";
  }

  const localDigits = toKoreanLocalMobileDigits(phoneNumberE164.replace(/\D/g, ""));

  if (!localDigits) {
    return phoneNumberE164;
  }

  if (localDigits.length === 10) {
    return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 6)}-${localDigits.slice(6)}`;
  }

  return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 7)}-${localDigits.slice(7)}`;
}

export function maskPhoneNumber(phoneNumberE164: string) {
  const localDigits = toKoreanLocalMobileDigits(phoneNumberE164.replace(/\D/g, ""));

  if (!localDigits) {
    return phoneNumberE164;
  }

  if (localDigits.length === 10) {
    return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 4)}**-${localDigits.slice(6)}`;
  }

  return `${localDigits.slice(0, 3)}-${localDigits.slice(3, 5)}**-${localDigits.slice(7)}`;
}

function toKoreanLocalMobileDigits(digits: string) {
  if (digits.startsWith("82")) {
    const withoutCountryCode = digits.slice(2);

    if (!withoutCountryCode) {
      return null;
    }

    return `0${withoutCountryCode}`;
  }

  if (digits.startsWith("0082")) {
    const withoutCountryCode = digits.slice(4);

    if (!withoutCountryCode) {
      return null;
    }

    return `0${withoutCountryCode}`;
  }

  return digits.startsWith("0") ? digits : null;
}
