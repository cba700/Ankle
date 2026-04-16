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
import {
  listCouponTemplates,
  listCouponUsageSummaries,
} from "@/lib/coupons";
import { getAdminMatchEntityById, listAdminMatchEntities, type MatchEntity } from "@/lib/match-store";
import { listSentApplicationNotificationIds } from "@/lib/notifications";
import {
  assertAdminMatchParticipantsSchemaReady,
  assertCashChargeOperationsSchemaReady,
  assertCouponSchemaReady,
  assertCashRefundRequestSchemaReady,
} from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminVenueEntityById, listAdminVenueEntities, type VenueEntity } from "@/lib/venue-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buildAdminVenueLabel } from "./match-form";
import type {
  AdminMatchParticipantRecord,
  AdminMatchRecord,
  AdminCouponTemplateRecord,
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

  await assertAdminMatchParticipantsSchemaReady(supabase);

  const entities = await listAdminMatchEntities();
  const participantsByMatchId = await getAdminMatchParticipantsByMatchId(
    supabase,
    entities.map((entity) => entity.id),
  );
  const noShowNoticeSentIds = await listSentApplicationNotificationIds(
    Array.from(participantsByMatchId.values()).flatMap((participants) =>
      participants.map((participant) => participant.applicationId),
    ),
    "no_show_notice",
  );

  return entities.map((entity) =>
    mapEntityToAdminRecord(
      entity,
      (participantsByMatchId.get(entity.id) ?? []).map((participant) => ({
        ...participant,
        noShowNoticeSent: noShowNoticeSentIds.has(participant.applicationId),
      })),
    ),
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

  await assertAdminMatchParticipantsSchemaReady(supabase);

  const entity = await getAdminMatchEntityById(id);

  if (!entity) {
    return undefined;
  }

  const participantsByMatchId = await getAdminMatchParticipantsByMatchId(supabase, [id]);
  const participants = participantsByMatchId.get(id) ?? [];
  const noShowNoticeSentIds = await listSentApplicationNotificationIds(
    participants.map((participant) => participant.applicationId),
    "no_show_notice",
  );

  return mapEntityToAdminRecord(
    entity,
    participants.map((participant) => ({
      ...participant,
      noShowNoticeSent: noShowNoticeSentIds.has(participant.applicationId),
    })),
  );
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

export async function getAdminCouponDashboardData() {
  if (!isSupabaseConfigured()) {
    return {
      templates: [] as AdminCouponTemplateRecord[],
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      templates: [] as AdminCouponTemplateRecord[],
    };
  }

  await assertCouponSchemaReady(supabase);

  const [templates, usageSummaries] = await Promise.all([
    listCouponTemplates(supabase),
    listCouponUsageSummaries(supabase),
  ]);

  const usageByTemplateId = new Map<
    string,
    { availableCount: number; issuedCount: number; usedCount: number }
  >();

  for (const summary of usageSummaries) {
    if (!summary.templateId) {
      continue;
    }

    const current = usageByTemplateId.get(summary.templateId) ?? {
      availableCount: 0,
      issuedCount: 0,
      usedCount: 0,
    };
    current.issuedCount += 1;

    if (summary.status === "available") {
      current.availableCount += 1;
    }

    if (summary.status === "used") {
      current.usedCount += 1;
    }

    usageByTemplateId.set(summary.templateId, current);
  }

  return {
    templates: templates.map((template) => {
      const usage = usageByTemplateId.get(template.id) ?? {
        availableCount: 0,
        issuedCount: 0,
        usedCount: 0,
      };

      return {
        availableCount: usage.availableCount,
        createdAt: template.createdAt,
        discountAmount: template.discountAmount,
        id: template.id,
        isActive: template.isActive,
        issuedCount: usage.issuedCount,
        name: template.name,
        updatedAt: template.updatedAt,
        usedCount: usage.usedCount,
      };
    }),
  };
}

type MatchParticipantRow = {
  application_id: string;
  applied_at: string;
  display_name: string | null;
  gender: "female" | "male" | null;
  match_id: string;
  player_level: string | null;
  temporary_level: string | null;
  user_id: string;
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

  const { data, error } = await ((supabase.rpc("list_admin_match_participants", {
    p_match_ids: matchIds,
  }) as any) as {
    data: MatchParticipantRow[] | null;
    error: { message: string } | null;
  });

  if (error) {
    throw new Error(`Failed to load admin match participants: ${error.message}`);
  }

  for (const row of (data ?? []) as MatchParticipantRow[]) {
    const existingParticipants = participantsByMatchId.get(row.match_id) ?? [];

    existingParticipants.push({
      applicationId: row.application_id,
      displayName: row.display_name?.trim() || "이름 미등록",
      gender: row.gender ?? null,
      noShowNoticeSent: false,
      playerLevel:
        row.player_level ??
        row.temporary_level ??
        null,
      playerLevelSource: row.player_level
        ? "player_level"
        : row.temporary_level
          ? "temporary_level"
          : "unset",
      userId: row.user_id,
    });

    participantsByMatchId.set(row.match_id, existingParticipants);
  }

  return participantsByMatchId;
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
