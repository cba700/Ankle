export const CASH_REFUND_BANK_OPTIONS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "케이뱅크",
  "SC제일은행",
  "우체국",
  "수협은행",
  "새마을금고",
  "부산은행",
  "대구은행",
  "광주은행",
  "전북은행",
  "경남은행",
] as const;

export type CashRefundBankName = (typeof CASH_REFUND_BANK_OPTIONS)[number];

const ACCOUNT_NUMBER_MIN_LENGTH = 8;
const ACCOUNT_NUMBER_MAX_LENGTH = 20;
const ACCOUNT_HOLDER_MAX_LENGTH = 40;

export function isCashRefundBankName(value: string): value is CashRefundBankName {
  return CASH_REFUND_BANK_OPTIONS.includes(value as CashRefundBankName);
}

export function normalizeCashRefundAccountNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, ACCOUNT_NUMBER_MAX_LENGTH);
}

export function isValidCashRefundAccountNumber(value: string) {
  return (
    value.length >= ACCOUNT_NUMBER_MIN_LENGTH &&
    value.length <= ACCOUNT_NUMBER_MAX_LENGTH
  );
}

export function normalizeCashRefundAccountHolder(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, ACCOUNT_HOLDER_MAX_LENGTH);
}

export function isValidCashRefundAccountHolder(value: string) {
  return value.length > 0;
}

export function maskCashRefundAccountNumber(value: string) {
  if (value.length <= 4) {
    return value;
  }

  return `${"*".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}
