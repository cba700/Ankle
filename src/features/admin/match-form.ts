import type { AdminMatchFormat, AdminMatchLevelPreset } from "./types";

export const MATCH_DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 210, 240];

export function buildAdminVenueLabel(name: string, district: string) {
  return district ? `${name} · ${district}` : name;
}

export function buildGeneratedMatchTitle({
  venueName,
  format,
  startTime,
}: {
  venueName: string;
  format: AdminMatchFormat | "";
  startTime: string;
}) {
  return [venueName, format, startTime].filter(Boolean).join(" ").trim();
}

export function formatMatchDurationLabel(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (minutes === 0) {
    return hours === 0 ? "0분" : `${hours}시간`;
  }

  if (hours === 0) {
    return `${minutes}분`;
  }

  return `${hours}시간 ${minutes}분`;
}

export function getMatchDurationMinutes(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const totalMinutes = Math.max(Math.round((end - start) / (1000 * 60)), 0);

  return totalMinutes > 0 ? String(totalMinutes) : "";
}

export function getMatchLevelPreset(
  levelCondition: string,
  levelRange: string,
): AdminMatchLevelPreset {
  if (levelCondition.includes("상급") || levelRange.includes("상급")) {
    return "high";
  }

  if (levelCondition.includes("중급")) {
    return "middle";
  }

  if (levelCondition.includes("초급") || levelRange.includes("초급")) {
    return "basic";
  }

  return "all";
}

export function getMatchLevelValues(level: AdminMatchLevelPreset) {
  if (level === "basic") {
    return {
      levelCondition: "초급 환영",
      levelRange: "초급 ~ 중급",
    };
  }

  if (level === "middle") {
    return {
      levelCondition: "중급 이상 권장",
      levelRange: "중급 ~ 상급",
    };
  }

  if (level === "high") {
    return {
      levelCondition: "상급 위주",
      levelRange: "상급",
    };
  }

  return {
    levelCondition: "모든 레벨",
    levelRange: "초급 ~ 중급",
  };
}

export function inferDistrictFromAddress(address: string) {
  const match = address.match(/서울(?:특별시)?\s+([^\s]+구)/);
  return match?.[1] ?? "";
}
