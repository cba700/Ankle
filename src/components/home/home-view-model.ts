import type { MatchRecord } from "@/lib/matches";
import type {
  HomeFilterGroup,
  HomeGenderFilterKey,
  HomeLevelFilterKey,
  HomeMatchRow,
} from "./home-types";

export const HOME_HERO = {
  eyebrow: "농구 매칭 플랫폼",
  title: ["존중하고 격려하고", "함께 즐겨요"],
};

export const SEOUL_DISTRICTS = [
  "강남",
  "강동",
  "강북",
  "강서",
  "관악",
  "광진",
  "구로",
  "금천",
  "노원",
  "도봉",
  "동대문",
  "동작",
  "마포",
  "서대문",
  "서초",
  "성동",
  "성북",
  "송파",
  "양천",
  "영등포",
  "용산",
  "은평",
  "종로",
  "중",
  "중랑",
] as const;

export const HOME_FILTER_GROUPS: HomeFilterGroup[] = [
  {
    id: "districts",
    label: "지역",
    options: SEOUL_DISTRICTS.map((district) => ({
      id: district,
      label: `${district}구`,
    })),
  },
  {
    id: "genders",
    label: "성별",
    options: [
      { id: "male", label: "남" },
      { id: "female", label: "여" },
      { id: "mixed", label: "남녀 모두" },
    ],
  },
  {
    id: "levels",
    label: "레벨",
    options: [
      { id: "basic", label: "Basic" },
      { id: "middle", label: "Middle" },
      { id: "high", label: "High" },
      { id: "star", label: "Star" },
    ],
  },
];

export function buildHomeMatchRows(matches: MatchRecord[]): HomeMatchRow[] {
  return matches.map((match) => {
    const status = getHomeStatus(match);

    return {
      id: match.id,
      publicId: match.publicId,
      dateKey: match.dateKey,
      district: match.district,
      genderKey: getHomeGenderKey(match.genderCondition),
      levelKey: getHomeLevelKey(match.averageLevel),
      time: match.time,
      statusLabel: status.label,
      statusTone: status.tone,
      isUrgent: status.isUrgent,
      isClosed: !match.canApply,
      venueName: match.venueName,
      title: match.title,
      meta: [match.genderCondition, match.format].join(" · "),
      isNew: match.canApply && match.status.kind === "open" && match.currentParticipants <= 3,
    };
  });
}

function getHomeStatus(match: MatchRecord) {
  const thresholds =
    match.format === "3vs3"
      ? { confirmedSoon: 3, closingSoon: 6, closed: 9 }
      : { confirmedSoon: 7, closingSoon: 12, closed: 15 };

  if (!match.canApply || match.currentParticipants >= thresholds.closed) {
    return { label: "마감", tone: "neutral" as const, isUrgent: false };
  }

  if (match.currentParticipants >= thresholds.closingSoon) {
    return { label: "마감 임박", tone: "danger" as const, isUrgent: true };
  }

  if (match.currentParticipants >= thresholds.confirmedSoon) {
    return { label: "확정 임박!", tone: "accent" as const, isUrgent: false };
  }

  return { label: "", tone: "open" as const, isUrgent: false };
}

function getHomeGenderKey(value: string): HomeGenderFilterKey | null {
  if (value.includes("남녀")) {
    return "mixed";
  }

  if (value.includes("여성") || value.includes("여자") || value.trim() === "여") {
    return "female";
  }

  if (value.includes("남성") || value.includes("남자") || value.trim() === "남") {
    return "male";
  }

  return null;
}

function getHomeLevelKey(value: string): HomeLevelFilterKey | null {
  if (value.includes("Basic")) {
    return "basic";
  }

  if (value.includes("Middle")) {
    return "middle";
  }

  if (value.includes("High")) {
    return "high";
  }

  if (value.includes("Star")) {
    return "star";
  }

  return null;
}
