import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  isActive: boolean;
};

export type MatchEntity = {
  id: string;
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
  is_active: boolean;
};

type MatchRow = {
  id: string;
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
  venue: MatchVenueRow | MatchVenueRow[] | null;
};

type MatchCountRow = {
  match_id: string;
  confirmed_count: number;
};

const MATCH_SELECT = `
  id,
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
    is_active
  )
`;

export async function listPublicMatchEntities() {
  return listMatchEntities({
    publicOnly: true,
  });
}

export async function getPublicMatchEntityBySlug(slug: string) {
  const matches = await listMatchEntities({
    publicOnly: true,
    slug,
  });

  return matches[0] ?? null;
}

export async function listAdminMatchEntities() {
  return listMatchEntities({
    publicOnly: false,
  });
}

export async function getAdminMatchEntityById(id: string) {
  const matches = await listMatchEntities({
    id,
    publicOnly: false,
  });

  return matches[0] ?? null;
}

async function listMatchEntities({
  publicOnly,
  id,
  slug,
}: {
  publicOnly: boolean;
  id?: string;
  slug?: string;
}) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
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

  const counts = await getConfirmedCountMap(rows.map((row) => row.id));

  return rows
    .map((row) => {
      const venue = normalizeVenue(row.venue);

      if (!venue) {
        return null;
      }

      return {
        id: row.id,
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
        tags: row.tags ?? [],
        imageUrls: row.image_urls ?? [],
        rules: row.rules ?? [],
        safetyNotes: row.safety_notes ?? [],
        viewCount: row.view_count,
        likeCount: row.like_count,
        venue: {
          id: venue.id,
          slug: venue.slug,
          name: venue.name,
          district: venue.district,
          address: venue.address,
          directions: venue.directions,
          parking: venue.parking,
          smoking: venue.smoking,
          showerLocker: venue.shower_locker,
          isActive: venue.is_active,
        },
      } satisfies MatchEntity;
    })
    .filter((match): match is MatchEntity => match !== null);
}

async function getConfirmedCountMap(matchIds: string[]) {
  const supabase = await getSupabaseServerClient();

  if (!supabase || matchIds.length === 0) {
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

function normalizeVenue(venue: MatchRow["venue"]) {
  if (!venue) {
    return null;
  }

  return Array.isArray(venue) ? venue[0] ?? null : venue;
}
