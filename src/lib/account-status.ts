export type AccountStatus = "active" | "withdrawal_pending" | "withdrawn";

export function normalizeAccountStatus(value: unknown): AccountStatus {
  if (value === "withdrawal_pending" || value === "withdrawn") {
    return value;
  }

  return "active";
}

export function isActiveAccountStatus(value: unknown) {
  return normalizeAccountStatus(value) === "active";
}
