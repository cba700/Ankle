import "server-only";

import { formatDateLabel, formatSeoulTime, toDateKey } from "@/lib/date";
import {
  getMatchBySlug as getMockMatchBySlug,
  getMatches as getMockMatches,
  type DistributionEntry,
  type MatchRecord,
  type MatchStatus,
} from "@/lib/matches";
import { getPublicMatchEntityBySlug, listPublicMatchEntities, type MatchEntity } from "@/lib/match-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const DEFAULT_IMAGE_URLS = ["/court-a.svg", "/court-b.svg", "/court-c.svg", "/court-d.svg"];

export async function getPublicMatches() {
  if (!isSupabaseConfigured()) {
    return getMockMatches();
  }

  try {
    const entities = await listPublicMatchEntities();
    return entities.map(mapEntityToMatchRecord);
  } catch {
    return getMockMatches();
  }
}

export async function getPublicMatchBySlug(slug: string) {
  const normalizedSlug = normalizeMatchSlug(slug);

  if (!isSupabaseConfigured()) {
    return getMockMatchBySlug(normalizedSlug) ?? null;
  }

  try {
    const entity = await getPublicMatchEntityBySlug(normalizedSlug);
    return entity ? mapEntityToMatchRecord(entity) : null;
  } catch {
    return getMockMatchBySlug(normalizedSlug) ?? null;
  }
}

function normalizeMatchSlug(slug: string) {
  if (!slug.includes("%")) {
    return slug;
  }

  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function mapEntityToMatchRecord(entity: MatchEntity): MatchRecord {
  const date = new Date(entity.startAt);
  const isStarted = date.getTime() <= Date.now();
  const dateKey = toDateKey(date);
  const levelDistribution = getLevelDistribution(entity);
  const currentParticipants = entity.confirmedCount;
  const remainingSlots = Math.max(entity.capacity - currentParticipants, 0);
  const isSoldOut = remainingSlots === 0;
  const canApply = entity.status === "open" && !isStarted && !isSoldOut;

  return {
    id: entity.id,
    slug: entity.slug,
    dateKey,
    dateLabel: formatDateLabel(date),
    dateTitle: `${formatDateLabel(date)} 매치`,
    time: formatSeoulTime(new Date(entity.startAt)),
    venueName: entity.venue.name,
    district: entity.venue.district,
    address: entity.venue.address,
    title: entity.title,
    genderCondition: entity.genderCondition,
    levelCondition: entity.levelCondition,
    levelRange: entity.levelRange,
    format: entity.format,
    durationText: getDurationText(entity.startAt, entity.endAt),
    capacity: entity.capacity,
    currentParticipants,
    remainingSlots,
    isSoldOut,
    canApply,
    preparation: entity.preparation,
    price: entity.price,
    status: getPublicStatus(entity, { isSoldOut, isStarted }),
    imageUrls:
      entity.venue.defaultImageUrls.length > 0
        ? entity.venue.defaultImageUrls
        : DEFAULT_IMAGE_URLS,
    venueInfo: {
      directions: entity.venue.directions,
      parking: entity.venue.parking,
      smoking: entity.venue.smoking,
      showerLocker: entity.venue.showerLocker,
    },
    rules: entity.rules,
    safetyNotes: entity.safetyNotes,
    levelDistribution,
    averageLevel: getAverageLevelLabel(entity, levelDistribution),
  };
}

function getDurationText(startAt: string, endAt: string) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const totalMinutes = Math.max(Math.round((end - start) / (1000 * 60)), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}시간`;
  }

  if (hours === 0) {
    return `${minutes}분`;
  }

  return `${hours}시간 ${minutes}분`;
}

function getPublicStatus(
  entity: MatchEntity,
  {
    isSoldOut,
    isStarted,
  }: {
    isSoldOut: boolean;
    isStarted: boolean;
  },
): MatchStatus {
  if (entity.status === "closed" || isSoldOut || isStarted) {
    return { kind: "closed", label: "마감" };
  }

  if (entity.format === "3vs3") {
    if (entity.confirmedCount >= 6) {
      return { kind: "closingSoon", label: "마감 임박" };
    }

    if (entity.confirmedCount >= 4) {
      return { kind: "confirmedSoon", label: "확정 임박" };
    }
  }

  if (entity.format === "5vs5") {
    if (entity.confirmedCount >= 12) {
      return { kind: "closingSoon", label: "마감 임박" };
    }

    if (entity.confirmedCount >= 7) {
      return { kind: "confirmedSoon", label: "확정 임박" };
    }
  }

  return { kind: "open", label: "모집 중" };
}

function getLevelDistribution(entity: MatchEntity): DistributionEntry[] {
  if (entity.levelCondition.includes("중급") || entity.levelRange.includes("상급")) {
    return [
      { label: "Basic", value: 12, tone: "basic" },
      { label: "Middle", value: 48, tone: "middle" },
      { label: "High", value: 40, tone: "high" },
    ];
  }

  if (entity.levelCondition.includes("초급") || entity.levelRange.includes("초급")) {
    return [
      { label: "Basic", value: 48, tone: "basic" },
      { label: "Middle", value: 37, tone: "middle" },
      { label: "High", value: 15, tone: "high" },
    ];
  }

  return [
    { label: "Basic", value: 30, tone: "basic" },
    { label: "Middle", value: 50, tone: "middle" },
    { label: "High", value: 20, tone: "high" },
  ];
}

function getAverageLevelLabel(
  entity: MatchEntity,
  distribution: DistributionEntry[],
) {
  const highRatio = distribution.find((entry) => entry.tone === "high")?.value ?? 0;
  const basicRatio = distribution.find((entry) => entry.tone === "basic")?.value ?? 0;

  if (highRatio >= 35) {
    return "예상 평균 레벨은 Middle 4 정도입니다.";
  }

  if (basicRatio >= 45) {
    return "예상 평균 레벨은 Basic 4 정도입니다.";
  }

  if (entity.format === "5vs5") {
    return "예상 평균 레벨은 Middle 3 정도입니다.";
  }

  return "예상 평균 레벨은 Middle 1 정도입니다.";
}
