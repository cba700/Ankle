import type { MatchRecord } from "@/lib/matches";
import type { HomeFilterItem, HomeMatchRow } from "./home-types";

export const HOME_HERO = {
  eyebrow: "농구 매칭 플랫폼",
  title: ["존중하고 격려하고", "함께 즐겨요"],
};

export const HOME_FILTERS: HomeFilterItem[] = [
  { id: "hideClosed", label: "마감 가리기", kind: "toggle" },
  { id: "region", label: "지역", kind: "menu" },
  { id: "gender", label: "성별", kind: "menu" },
  { id: "level", label: "레벨", kind: "menu" },
  { id: "shade", label: "그늘막", kind: "toggle" },
];

export function buildHomeMatchRows(matches: MatchRecord[]): HomeMatchRow[] {
  return matches.map((match) => {
    const status = getHomeStatus(match);

    return {
      id: match.id,
      publicId: match.publicId,
      dateKey: match.dateKey,
      time: match.time,
      statusLabel: status.label,
      statusTone: status.tone,
      isUrgent: status.isUrgent,
      isClosed: !match.canApply,
      venueName: match.venueName,
      title: match.title,
      meta: [match.venueName, match.genderCondition, match.format].join(" · "),
      isNew: match.canApply && match.status.kind === "open" && match.currentParticipants <= 3,
    };
  });
}

function getHomeStatus(match: MatchRecord) {
  if (!match.canApply) {
    return { label: "마감", tone: "neutral" as const, isUrgent: false };
  }

  if (match.status.kind === "closingSoon") {
    return { label: "마감 임박", tone: "danger" as const, isUrgent: true };
  }

  if (match.status.kind === "confirmedSoon") {
    return { label: "확정 임박", tone: "accent" as const, isUrgent: false };
  }

  return { label: "모집 중", tone: "open" as const, isUrgent: false };
}
