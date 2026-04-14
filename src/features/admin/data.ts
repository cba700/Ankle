import "server-only";

import { getAdminMatchById as getMockAdminMatchById, getAdminMatches as getMockAdminMatches } from "@/features/admin/mock/admin-matches";
import {
  getAdminVenueById as getMockAdminVenueById,
  getAdminVenueOptions as getMockAdminVenueOptions,
  getAdminVenues as getMockAdminVenues,
} from "@/features/admin/mock/admin-venues";
import {
  listCashAccounts,
  listRecentCashChargeOrders,
  listRecentCashChargeOrderEvents,
  listRecentCashRefundRequests,
  listRecentCashTransactions,
} from "@/lib/cash";
import { getAdminMatchEntityById, listAdminMatchEntities, type MatchEntity } from "@/lib/match-store";
import {
  assertAdminPlayerLevelSchemaReady,
  assertCashChargeOperationsSchemaReady,
  assertCashRefundRequestSchemaReady,
} from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { getAdminVenueEntityById, listAdminVenueEntities, type VenueEntity } from "@/lib/venue-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buildAdminVenueLabel } from "./match-form";
import type {
  AdminMatchParticipantRecord,
  AdminMatchRecord,
  AdminVenueOption,
  AdminVenueRecord,
} from "./types";

export async function getAdminMatches() {
  if (!isSupabaseConfigured()) {
    return getMockAdminMatches();
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return getMockAdminMatches();
  }

  await assertAdminPlayerLevelSchemaReady(supabase);

  const entities = await listAdminMatchEntities();
  const participantsByMatchId = await getAdminMatchParticipantsByMatchId(
    supabase,
    entities.map((entity) => entity.id),
  );

  return entities.map((entity) =>
    mapEntityToAdminRecord(entity, participantsByMatchId.get(entity.id) ?? []),
  );
}

export async function getAdminMatchById(id: string) {
  if (!isSupabaseConfigured()) {
    return getMockAdminMatchById(id);
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return getMockAdminMatchById(id);
  }

  await assertAdminPlayerLevelSchemaReady(supabase);

  const entity = await getAdminMatchEntityById(id);

  if (!entity) {
    return undefined;
  }

  const participantsByMatchId = await getAdminMatchParticipantsByMatchId(supabase, [id]);
  return mapEntityToAdminRecord(entity, participantsByMatchId.get(id) ?? []);
}

export async function getAdminVenues() {
  if (!isSupabaseConfigured()) {
    return getMockAdminVenues();
  }

  const entities = await listAdminVenueEntities();
  return entities.map(mapVenueEntityToAdminRecord);
}

export async function getAdminVenueById(id: string) {
  if (!isSupabaseConfigured()) {
    return getMockAdminVenueById(id);
  }

  const entity = await getAdminVenueEntityById(id);
  return entity ? mapVenueEntityToAdminRecord(entity) : undefined;
}

export async function getAdminVenueOptions(): Promise<AdminVenueOption[]> {
  if (!isSupabaseConfigured()) {
    return getMockAdminVenueOptions();
  }

  const entities = await listAdminVenueEntities();
  return entities.map(mapVenueEntityToOption);
}

export async function getAdminCashDashboardData() {
  if (!isSupabaseConfigured()) {
    return {
      accounts: [],
      chargeOrders: [],
      chargeOrderEvents: [],
      refundRequests: [],
      transactions: [],
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      accounts: [],
      chargeOrders: [],
      chargeOrderEvents: [],
      refundRequests: [],
      transactions: [],
    };
  }

  await assertCashChargeOperationsSchemaReady(supabase);
  await assertCashRefundRequestSchemaReady(supabase);

  const [accounts, chargeOrders, chargeOrderEvents, refundRequests, transactions] = await Promise.all([
    listCashAccounts(supabase),
    listRecentCashChargeOrders(supabase),
    listRecentCashChargeOrderEvents(supabase),
    listRecentCashRefundRequests(supabase),
    listRecentCashTransactions(supabase),
  ]);

  return {
    accounts,
    chargeOrders,
    chargeOrderEvents,
    refundRequests,
    transactions,
  };
}

type MatchParticipantProfileRow = {
  display_name: string | null;
  gender: "female" | "male" | null;
  player_level: string | null;
  temporary_level: string | null;
};

type MatchParticipantRow = {
  id: string;
  match_id: string;
  user_id: string | null;
};

function mapEntityToAdminRecord(
  entity: MatchEntity,
  participants: AdminMatchParticipantRecord[],
): AdminMatchRecord {
  return {
    id: entity.id,
    slug: entity.slug,
    venueId: entity.venue.id,
    title: entity.title,
    venueName: entity.venue.name,
    district: entity.venue.district,
    address: entity.venue.address,
    startAt: entity.startAt,
    endAt: entity.endAt,
    status: entity.status,
    format: entity.format,
    capacity: entity.capacity,
    currentParticipants: entity.confirmedCount,
    price: entity.price,
    genderCondition: entity.genderCondition,
    levelCondition: entity.levelCondition,
    levelRange: entity.levelRange,
    preparation: entity.preparation,
    summary: entity.summary,
    operatorNote: entity.operatorNote,
    publicNotice: entity.publicNotice,
    tags: entity.tags,
    imageUrls: entity.imageUrls,
    rules: entity.rules,
    safetyNotes: entity.safetyNotes,
    participants,
    venueInfo: {
      directions: entity.venue.directions,
      parking: entity.venue.parking,
      smoking: entity.venue.smoking,
      showerLocker: entity.venue.showerLocker,
    },
  };
}

async function getAdminMatchParticipantsByMatchId(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  matchIds: string[],
) {
  const participantsByMatchId = new Map<string, AdminMatchParticipantRecord[]>();

  if (matchIds.length === 0) {
    return participantsByMatchId;
  }

  const { data, error } = await supabase
    .from("match_applications")
    .select("id, match_id, user_id")
    .in("match_id", matchIds)
    .eq("status", "confirmed")
    .not("user_id", "is", null)
    .order("applied_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin match participants: ${error.message}`);
  }

  const participantRows = (data ?? []) as MatchParticipantRow[];
  const userIds = Array.from(
    new Set(
      participantRows
        .map((row) => row.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ),
  );
  const profilesById = await getParticipantProfilesByUserId(userIds);

  for (const row of participantRows) {
    if (!row.user_id) {
      continue;
    }

    const profile = profilesById.get(row.user_id) ?? null;
    const existingParticipants = participantsByMatchId.get(row.match_id) ?? [];

    existingParticipants.push({
      applicationId: row.id,
      displayName: profile?.display_name?.trim() || "이름 미등록",
      gender: profile?.gender ?? null,
      playerLevel:
        profile?.player_level ??
        profile?.temporary_level ??
        null,
      playerLevelSource: profile?.player_level
        ? "player_level"
        : profile?.temporary_level
          ? "temporary_level"
          : "unset",
      userId: row.user_id,
    });

    participantsByMatchId.set(row.match_id, existingParticipants);
  }

  return participantsByMatchId;
}

async function getParticipantProfilesByUserId(userIds: string[]) {
  const profilesById = new Map<string, MatchParticipantProfileRow>();

  if (userIds.length === 0) {
    return profilesById;
  }

  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, display_name, gender, player_level, temporary_level")
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to load participant profiles: ${error.message}`);
  }

  for (const row of (data ?? []) as (MatchParticipantProfileRow & { id: string })[]) {
    profilesById.set(row.id, row);
  }

  return profilesById;
}

function mapVenueEntityToAdminRecord(entity: VenueEntity): AdminVenueRecord {
  return {
    id: entity.id,
    slug: entity.slug,
    name: entity.name,
    district: entity.district,
    address: entity.address,
    isActive: entity.isActive,
    matchCount: entity.matchCount,
    venueInfo: {
      directions: entity.directions,
      parking: entity.parking,
      smoking: entity.smoking,
      showerLocker: entity.showerLocker,
    },
    defaultImageUrls: entity.defaultImageUrls,
    defaultRules: entity.defaultRules,
    defaultSafetyNotes: entity.defaultSafetyNotes,
  };
}

function mapVenueEntityToOption(entity: VenueEntity): AdminVenueOption {
  return {
    id: entity.id,
    label: buildAdminVenueLabel(entity.name, entity.district),
    isActive: entity.isActive,
    name: entity.name,
    district: entity.district,
    address: entity.address,
    venueInfo: {
      directions: entity.directions,
      parking: entity.parking,
      smoking: entity.smoking,
      showerLocker: entity.showerLocker,
    },
    defaultImageUrls: entity.defaultImageUrls,
    defaultRules: entity.defaultRules,
    defaultSafetyNotes: entity.defaultSafetyNotes,
  };
}
