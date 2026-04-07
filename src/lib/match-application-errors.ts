export type MatchApplicationErrorCode =
  | "ALREADY_APPLIED"
  | "APPLICATION_NOT_FOUND"
  | "AUTH_REQUIRED"
  | "INSUFFICIENT_CASH"
  | "MATCH_FULL"
  | "MATCH_NOT_FOUND"
  | "MATCH_NOT_OPEN"
  | "MATCH_STARTED"
  | "UNKNOWN";

export function getMatchApplicationError(message: string): {
  code: MatchApplicationErrorCode;
  status: number;
} {
  const normalized = message.toUpperCase();

  if (normalized.includes("AUTH_REQUIRED")) {
    return { code: "AUTH_REQUIRED", status: 401 };
  }

  if (normalized.includes("MATCH_NOT_FOUND")) {
    return { code: "MATCH_NOT_FOUND", status: 404 };
  }

  if (normalized.includes("APPLICATION_NOT_FOUND")) {
    return { code: "APPLICATION_NOT_FOUND", status: 404 };
  }

  if (normalized.includes("INSUFFICIENT_CASH")) {
    return { code: "INSUFFICIENT_CASH", status: 409 };
  }

  if (normalized.includes("MATCH_FULL")) {
    return { code: "MATCH_FULL", status: 409 };
  }

  if (normalized.includes("ALREADY_APPLIED")) {
    return { code: "ALREADY_APPLIED", status: 409 };
  }

  if (normalized.includes("MATCH_STARTED")) {
    return { code: "MATCH_STARTED", status: 409 };
  }

  if (normalized.includes("MATCH_NOT_OPEN")) {
    return { code: "MATCH_NOT_OPEN", status: 409 };
  }

  return { code: "UNKNOWN", status: 500 };
}
