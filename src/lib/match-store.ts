import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabasePublicServerClient,
  getSupabaseServerClient,
} from "@/lib/supabase/server";
import { assertVenueManagementSchemaReady } from "@/lib/supabase/schema";

export type MatchEntityStatus = "draft" | "open" | "closed" | "cancelled";
export type MatchEntityFormat = "3vs3" | "5vs5";

export type MatchVenueEntity = {
  id: string;
  slug: string;
  name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
  defaultImageUrls: string[];
  isActive: boolean;
};

export type MatchEntity = {
  id: string;
  publicId: string;
  slug: string;
  title: string;
  summary: string;
  publicNotice: string;
  operatorNote: string;
  status: MatchEntityStatus;
  format: MatchEntityFormat;
  startAt: string;
  endAt: string;
  capacity: number;
  confirmedCount: number;
  price: number;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  preparation: string;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
  tags: string[];
  imageUrls: string[];
  rules: string[];
  safetyNotes: string[];
  viewCount: number;
  likeCount: number;
  venue: MatchVenueEntity;
};

type MatchVenueRow = {
  id: string;
  slug: string;
  name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  shower_locker: string;
  weather_grid_nx: number | null;
  weather_grid_ny: number | null;
  default_image_urls: string[] | null;
  is_active: boolean;
};

type MatchRow = {
  id: string;
  public_id: string;
  slug: string;
  title: string;
  summary: string;
  public_notice: string;
  operator_note: string;
  status: MatchEntityStatus;
  format: MatchEntityFormat;
  start_at: string;
  end_at: string;
  capacity: number;
  price: number;
  gender_condition: string;
  level_condition: string;
  level_range: string;
  preparation: string;
  tags: string[] | null;
  image_urls: string[] | null;
  rules: string[] | null;
  safety_notes: string[] | null;
  view_count: number;
  like_count: number;
  venue_name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  shower_locker: string;
  weather_grid_nx: number | null;
  weather_grid_ny: number | null;
  venue: MatchVenueRow | MatchVenueRow[] | null;
};

type MatchCountRow = {
  match_id: string;
  confirmed_count: number;
};

type MatchStoreClient = SupabaseClient;

const MATCH_SELECT = `
  id,
  public_id,
  slug,
  title,
  summary,
  public_notice,
  operator_note,
  status,
  format,
  start_at,
  end_at,
  capacity,
  price,
  gender_condition,
  level_condition,
  level_range,
  preparation,
  tags,
  image_urls,
  rules,
  safety_notes,
  view_count,
  like_count,
  venue_name,
  district,
  address,
  directions,
  parking,
  smoking,
  shower_locker,
  weather_grid_nx,
  weather_grid_ny,
  venue:venues!matches_venue_id_fkey (
    id,
    slug,
    name,
    district,
    address,
    directions,
    parking,
    smoking,
    shower_locker,
    weather_grid_nx,
    weather_grid_ny,
    default_image_urls,
    is_active
  )
`;

export async function listPublicMatchEntities() {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return [];
  }

  return listMatchEntities({
    publicOnly: true,
    supabase,
  });
}

export async function getPublicMatchEntityByPublicId(publicId: string) {
  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return null;
  }

  const matches = await listMatchEntities({
    publicOnly: true,
    publicId,
    supabase,
  });

  return matches[0] ?? null;
}

export async function listAdminMatchEntities() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  return listMatchEntities({
    publicOnly: false,
    runManagementChecks: true,
    syncStartedStatuses: true,
    supabase,
  });
}

export async function getAdminMatchEntityById(id: string) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const matches = await listMatchEntities({
    id,
    publicOnly: false,
    runManagementChecks: true,
    syncStartedStatuses: true,
    supabase,
  });

  return matches[0] ?? null;
}

async function listMatchEntities({
  publicOnly,
  id,
  publicId,
  slug,
  runManagementChecks = false,
  syncStartedStatuses = false,
  supabase,
}: {
  publicOnly: boolean;
  id?: string;
  publicId?: string;
  slug?: string;
  runManagementChecks?: boolean;
  syncStartedStatuses?: boolean;
  supabase: MatchStoreClient;
}) {
  if (runManagementChecks) {
    await assertVenueManagementSchemaReady(supabase);
  }

  if (syncStartedStatuses) {
    await syncStartedMatchStatuses(supabase);
  }

  let query = supabase
    .from("matches")
    .select(MATCH_SELECT)
    .order("start_at", { ascending: true });

  if (publicOnly) {
    query = query
      .gte("start_at", new Date().toISOString())
      .in("status", ["open", "closed"]);
  }

  if (id) {
    query = query.eq("id", id);
  }

  if (publicId) {
    query = query.eq("public_id", publicId);
  }

  if (slug) {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load matches: ${error.message}`);
  }

  const rows = (data ?? []) as MatchRow[];

  if (rows.length === 0) {
    return [];
  }

  const counts = await getConfirmedCountMap(supabase, rows.map((row) => row.id));

  return rows
    .map((row) => {
      const venue = normalizeVenue(row.venue);

      if (!venue) {
        return null;
      }

      const venueName = row.venue_name || venue.name;
      const district = row.district || venue.district;
      const address = row.address || venue.address;
      const directions = row.directions || venue.directions;
      const parking = row.parking || venue.parking;
      const smoking = row.smoking || venue.smoking;
      const showerLocker = row.shower_locker || venue.shower_locker;
      const weatherGridNx = row.weather_grid_nx ?? venue.weather_grid_nx ?? null;
      const weatherGridNy = row.weather_grid_ny ?? venue.weather_grid_ny ?? null;

      return {
        id: row.id,
        publicId: row.public_id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        publicNotice: row.public_notice,
        operatorNote: row.operator_note,
        status: row.status,
        format: row.format,
        startAt: row.start_at,
        endAt: row.end_at,
        capacity: row.capacity,
        confirmedCount: counts.get(row.id) ?? 0,
        price: row.price,
        genderCondition: row.gender_condition,
        levelCondition: row.level_condition,
        levelRange: row.level_range,
        preparation: row.preparation,
        weatherGridNx,
        weatherGridNy,
        tags: row.tags ?? [],
        imageUrls: row.image_urls ?? [],
        rules: row.rules ?? [],
        safetyNotes: row.safety_notes ?? [],
        viewCount: row.view_count,
        likeCount: row.like_count,
        venue: {
          id: venue.id,
          slug: venue.slug,
          name: venueName,
          district,
          address,
          directions,
          parking,
          smoking,
          showerLocker,
          weatherGridNx: venue.weather_grid_nx ?? null,
          weatherGridNy: venue.weather_grid_ny ?? null,
          defaultImageUrls: venue.default_image_urls ?? [],
          isActive: venue.is_active,
        },
      } satisfies MatchEntity;
    })
    .filter((match): match is MatchEntity => match !== null);
}

async function getConfirmedCountMap(
  supabase: MatchStoreClient,
  matchIds: string[],
) {
  if (matchIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("match_application_counts")
    .select("match_id, confirmed_count")
    .in("match_id", matchIds);

  if (error) {
    throw new Error(`Failed to load match counts: ${error.message}`);
  }

  return new Map(
    ((data ?? []) as MatchCountRow[]).map((row) => [row.match_id, row.confirmed_count]),
  );
}

async function syncStartedMatchStatuses(
  supabase: MatchStoreClient,
) {
  const { error } = await supabase.rpc("close_started_matches");

  if (error) {
    throw new Error(`Failed to sync match statuses: ${error.message}`);
  }
}

function normalizeVenue(venue: MatchRow["venue"]) {
  if (!venue) {
    return null;
  }

  return Array.isArray(venue) ? venue[0] ?? null : venue;
}
