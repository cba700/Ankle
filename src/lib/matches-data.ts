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
import { getSupabasePublicServerClient } from "@/lib/supabase/server";

const DEFAULT_IMAGE_URLS = ["/court-a.svg", "/court-b.svg", "/court-c.svg", "/court-d.svg"];

type PublicMatchLevelDistributionRow = {
  label: DistributionEntry["label"];
  value: number | null;
};

const EMPTY_LEVEL_DISTRIBUTION: DistributionEntry[] = [
  { label: "Basic", value: 0, tone: "basic" },
  { label: "Middle", value: 0, tone: "middle" },
  { label: "High", value: 0, tone: "high" },
  { label: "Star", value: 0, tone: "star" },
];

export async function getPublicMatches() {
  if (!isSupabaseConfigured()) {
    return getMockMatches();
  }

  try {
    const entities = await listPublicMatchEntities();
    return entities.map((entity) => mapEntityToMatchRecord(entity));
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

    if (!entity) {
      return null;
    }

    const levelDistribution = await getPublicMatchLevelDistribution(entity.id);
    return mapEntityToMatchRecord(entity, { levelDistribution });
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

function mapEntityToMatchRecord(
  entity: MatchEntity,
  {
    levelDistribution = buildEmptyLevelDistribution(),
  }: {
    levelDistribution?: DistributionEntry[];
  } = {},
): MatchRecord {
  const date = new Date(entity.startAt);
  const isStarted = date.getTime() <= Date.now();
  const dateKey = toDateKey(date);
  const currentParticipants = entity.confirmedCount;
  const remainingSlots = Math.max(entity.capacity - currentParticipants, 0);
  const isSoldOut = remainingSlots === 0;
  const canApply = entity.status === "open" && !isStarted && !isSoldOut;
  const averageLevel = hasLevelDistributionData(levelDistribution)
    ? getAverageLevelText(levelDistribution)
    : "";

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
      courtNote: entity.venue.courtNote,
      directions: entity.venue.directions,
      parking: entity.venue.parking,
      smoking: entity.venue.smoking,
      showerLocker: entity.venue.showerLocker,
    },
    rules: entity.rules,
    safetyNotes: entity.safetyNotes,
    levelDistribution,
    averageLevel,
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

async function getPublicMatchLevelDistribution(matchId: string) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return buildEmptyLevelDistribution();
  }

  const { data, error } = await (((supabase as any).rpc(
    "get_public_match_level_distribution",
    {
      p_match_id: matchId,
    },
  ) as any) as {
    data: PublicMatchLevelDistributionRow[] | null;
    error: { message: string } | null;
  });

  if (error) {
    return buildEmptyLevelDistribution();
  }

  return mapPublicMatchLevelDistributionRows(data);
}

function mapPublicMatchLevelDistributionRows(
  rows: PublicMatchLevelDistributionRow[] | null | undefined,
) {
  const valuesByLabel = new Map<DistributionEntry["label"], number>(
    (rows ?? []).map((row) => [row.label, Math.max(row.value ?? 0, 0)]),
  );

  return EMPTY_LEVEL_DISTRIBUTION.map((item) => ({
    ...item,
    value: valuesByLabel.get(item.label) ?? 0,
  }));
}

function buildEmptyLevelDistribution() {
  return EMPTY_LEVEL_DISTRIBUTION.map((item) => ({ ...item }));
}

function hasLevelDistributionData(distribution: DistributionEntry[]) {
  return distribution.some((item) => item.value > 0);
}
