import { formatMoney } from "@/lib/date";

export const CASH_CHARGE_PACKAGES = [5000, 10000, 30000] as const;

export type CashChargePackage = (typeof CASH_CHARGE_PACKAGES)[number];

export function isCashChargePackage(value: unknown): value is CashChargePackage {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    CASH_CHARGE_PACKAGES.includes(value as CashChargePackage)
  );
}

export function buildCashChargeOrderId() {
  return `ankle_cash_${crypto.randomUUID()}`;
}

export function buildCashChargeOrderName(amount: number) {
  return `앵클 캐시 ${formatMoney(amount)}원 충전`;
}

export function buildCashChargePackageLabel(amount: number) {
  return `${formatMoney(amount)}원`;
}
