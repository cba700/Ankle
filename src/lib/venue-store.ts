import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertVenueManagementSchemaReady } from "@/lib/supabase/schema";

export type VenueEntity = {
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
  defaultRules: string[];
  defaultSafetyNotes: string[];
  isActive: boolean;
  matchCount: number;
};

type VenueRow = {
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
  default_rules: string[] | null;
  default_safety_notes: string[] | null;
  is_active: boolean;
};

type MatchVenueCountRow = {
  venue_id: string;
};

const VENUE_SELECT = `
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
  default_rules,
  default_safety_notes,
  is_active
`;

export async function listAdminVenueEntities() {
  return listVenueEntities();
}

export async function getAdminVenueEntityById(id: string) {
  const venues = await listVenueEntities(id);
  return venues[0] ?? null;
}

async function listVenueEntities(id?: string) {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return [];
  }

  await assertVenueManagementSchemaReady(supabase);

  let query = supabase
    .from("venues")
    .select(VENUE_SELECT)
    .order("name", { ascending: true });

  if (id) {
    query = query.eq("id", id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load venues: ${error.message}`);
  }

  const rows = (data ?? []) as VenueRow[];
  const matchCountMap = await getMatchCountMap(supabase, rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    district: row.district,
    address: row.address,
    directions: row.directions,
    parking: row.parking,
    smoking: row.smoking,
    showerLocker: row.shower_locker,
    weatherGridNx: row.weather_grid_nx,
    weatherGridNy: row.weather_grid_ny,
    defaultImageUrls: row.default_image_urls ?? [],
    defaultRules: row.default_rules ?? [],
    defaultSafetyNotes: row.default_safety_notes ?? [],
    isActive: row.is_active,
    matchCount: matchCountMap.get(row.id) ?? 0,
  }));
}

async function getMatchCountMap(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  venueIds: string[],
) {
  if (venueIds.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("matches")
    .select("venue_id")
    .in("venue_id", venueIds);

  if (error) {
    throw new Error(`Failed to load venue match counts: ${error.message}`);
  }

  return ((data ?? []) as MatchVenueCountRow[]).reduce((counts, row) => {
    counts.set(row.venue_id, (counts.get(row.venue_id) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}
