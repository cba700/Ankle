import "server-only";

import { getAdminMatchById as getMockAdminMatchById, getAdminMatches as getMockAdminMatches } from "@/features/admin/mock/admin-matches";
import {
  getAdminVenueById as getMockAdminVenueById,
  getAdminVenueOptions as getMockAdminVenueOptions,
  getAdminVenues as getMockAdminVenues,
} from "@/features/admin/mock/admin-venues";
import { getAdminMatchEntityById, listAdminMatchEntities, type MatchEntity } from "@/lib/match-store";
import { getAdminVenueEntityById, listAdminVenueEntities, type VenueEntity } from "@/lib/venue-store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminMatchRecord, AdminVenueOption, AdminVenueRecord } from "./types";

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

function mapEntityToAdminRecord(entity: MatchEntity): AdminMatchRecord {
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
    venueInfo: {
      directions: entity.venue.directions,
      parking: entity.venue.parking,
      smoking: entity.venue.smoking,
      showerLocker: entity.venue.showerLocker,
    },
  };
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
    label: `${entity.name} · ${entity.district}`,
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
