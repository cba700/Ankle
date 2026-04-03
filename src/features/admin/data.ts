import "server-only";

import { getAdminMatchById as getMockAdminMatchById, getAdminMatches as getMockAdminMatches } from "@/features/admin/mock/admin-matches";
import { getAdminMatchEntityById, listAdminMatchEntities, type MatchEntity } from "@/lib/match-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminMatchRecord } from "./types";

export async function getAdminMatches() {
  if (!isSupabaseConfigured()) {
    return getMockAdminMatches();
  }

  const entities = await listAdminMatchEntities();
  return entities.map(mapEntityToAdminRecord);
}

export async function getAdminMatchById(id: string) {
  if (!isSupabaseConfigured()) {
    return getMockAdminMatchById(id);
  }

  const entity = await getAdminMatchEntityById(id);
  return entity ? mapEntityToAdminRecord(entity) : undefined;
}

function mapEntityToAdminRecord(entity: MatchEntity): AdminMatchRecord {
  return {
    id: entity.id,
    slug: entity.slug,
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
    venueInfo: {
      directions: entity.venue.directions,
      parking: entity.venue.parking,
      smoking: entity.venue.smoking,
      showerLocker: entity.venue.showerLocker,
    },
  };
}
