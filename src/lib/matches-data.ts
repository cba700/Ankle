import "server-only";

import { formatDateLabel, formatSeoulTime, toDateKey } from "@/lib/date";
import {
  getAverageLevelText,
  getMatchByPublicId as getMockMatchByPublicId,
  getMatches as getMockMatches,
  type DistributionEntry,
  type MatchRecord,
  type MatchStatus,
} from "@/lib/matches";
import { getPublicMatchEntityByPublicId, listPublicMatchEntities, type MatchEntity } from "@/lib/match-store";
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

export async function getPublicMatchByPublicId(publicId: string) {
  const normalizedPublicId = normalizePublicId(publicId);

  if (!isSupabaseConfigured()) {
    return getMockMatchByPublicId(normalizedPublicId) ?? null;
  }

  try {
    const entity = await getPublicMatchEntityByPublicId(normalizedPublicId);
    return entity ? mapEntityToMatchRecord(entity) : null;
  } catch {
    return getMockMatchByPublicId(normalizedPublicId) ?? null;
  }
}

function normalizePublicId(publicId: string) {
  if (!publicId.includes("%")) {
    return publicId;
  }

  try {
    return decodeURIComponent(publicId);
  } catch {
    return publicId;
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
    publicId: entity.publicId,
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
    averageLevel: getAverageLevelText(levelDistribution),
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
      { label: "Basic", value: 8, tone: "basic" },
      { label: "Middle", value: 34, tone: "middle" },
      { label: "High", value: 38, tone: "high" },
      { label: "Star", value: 20, tone: "star" },
    ];
  }

  if (entity.levelCondition.includes("초급") || entity.levelRange.includes("초급")) {
    return [
      { label: "Basic", value: 69, tone: "basic" },
      { label: "Middle", value: 17, tone: "middle" },
      { label: "High", value: 10, tone: "high" },
      { label: "Star", value: 4, tone: "star" },
    ];
  }

  return [
    { label: "Basic", value: 26, tone: "basic" },
    { label: "Middle", value: 44, tone: "middle" },
    { label: "High", value: 20, tone: "high" },
    { label: "Star", value: 10, tone: "star" },
  ];
}
