import type { MatchRecord } from "@/lib/matches";
import type { HomeFilterItem, HomeMatchBadge, HomeMatchRow, HomeQuickMenuItem } from "./home-types";

export const HOME_HERO = {
  eyebrow: "총 리워드 1,100만 원!",
  title: ["앵클을 소개할", "300인의 앵클러를 찾아요"],
  badgeNumber: "300",
  badgeLabel: "앵클러",
  description: "첫 배포 전 함께 확인할 앵클의 소셜 매치 홈을 먼저 공개합니다.",
  slideLabel: "1 | 1",
};

export const HOME_NOTICE =
  "매치가 취소될까 걱정되나요? 신청 전에 자리만 먼저 확인할 수 있는 흐름도 곧 붙일 예정입니다.";

export const HOME_TABS = ["소셜 매치"];

export const HOME_QUICK_MENUS: HomeQuickMenuItem[] = [
  { id: "all", icon: "matches", label: "전체 매치" },
  { id: "beginner", icon: "beginner", label: "입문 추천" },
  { id: "riverside", icon: "riverside", label: "한강 코트" },
  { id: "closing", icon: "closingSoon", label: "마감 임박" },
  { id: "wishlist", icon: "wishlist", label: "관심 매치" },
];

export const HOME_FILTERS: HomeFilterItem[] = [
  { id: "hideClosed", label: "마감 가리기", kind: "toggle" },
  { id: "benefits", label: "혜택", kind: "menu" },
  { id: "gender", label: "성별", kind: "menu" },
  { id: "level", label: "레벨", kind: "menu" },
  { id: "shade", label: "실내·그늘막", kind: "toggle" },
];

export function buildHomeMatchRows(matches: MatchRecord[]): HomeMatchRow[] {
  return matches.map((match) => {
    const badges = getHomeMatchBadges(match);
    const status = getHomeStatus(match);

    return {
      id: match.id,
      slug: match.slug,
      dateKey: match.dateKey,
      time: match.time,
      statusLabel: status.label,
      statusTone: status.tone,
      isUrgent: status.isUrgent,
      isClosed: match.status.kind === "closed",
      venueName: match.venueName,
      title: match.title,
      meta: [
        match.genderCondition,
        match.format.replace("vs", "on"),
        getParkingMeta(match.venueInfo.parking),
      ],
      badges,
      isNew: match.status.kind === "open" && match.currentParticipants <= 3,
    };
  });
}

function getHomeMatchBadges(match: MatchRecord): HomeMatchBadge[] {
  const badges: HomeMatchBadge[] = [];

  if (match.levelCondition === "모든 레벨" || match.levelCondition.includes("초급")) {
    badges.push({ label: "입문 환영", tone: "green" });
  }

  if (match.format === "5vs5") {
    badges.push({ label: "밸런스 팀 배정", tone: "blue" });
  } else if (match.price <= 5900) {
    badges.push({ label: "가벼운 참가비", tone: "orange" });
  }

  return badges.slice(0, 2);
}

function getHomeStatus(match: MatchRecord) {
  if (match.status.kind === "closed") {
    return { label: "마감", tone: "neutral" as const, isUrgent: false };
  }

  if (match.status.kind === "closingSoon") {
    return { label: "마감임박", tone: "danger" as const, isUrgent: true };
  }

  if (match.status.kind === "confirmedSoon") {
    return { label: "확정임박", tone: "accent" as const, isUrgent: false };
  }

  return { label: "모집중", tone: "open" as const, isUrgent: false };
}

function getParkingMeta(parkingText: string) {
  if (parkingText.includes("없")) {
    return "주차 확인";
  }

  if (parkingText.includes("혼잡") || parkingText.includes("만차") || parkingText.includes("정체")) {
    return "주차 혼잡";
  }

  return "주차 가능";
}
