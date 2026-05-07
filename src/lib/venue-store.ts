import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { assertVenueManagementSchemaReady } from "@/lib/supabase/schema";

export type VenueEntity = {
  id: string;
  slug: string;
  name: string;
  district: string;
  address: string;
  courtNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
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
  court_note: string | null;
  directions: string | null;
  parking: string | null;
  smoking: string | null;
  shower_locker: string | null;
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
  court_note,
  directions,
  parking,
  smoking,
  shower_locker,
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
    courtNote: row.court_note?.trim() || buildLegacyCourtNote(row),
    directions: row.directions ?? "",
    parking: row.parking ?? "",
    smoking: row.smoking ?? "",
    showerLocker: row.shower_locker ?? "",
    defaultImageUrls: row.default_image_urls ?? [],
    defaultRules: row.default_rules ?? [],
    defaultSafetyNotes: row.default_safety_notes ?? [],
    isActive: row.is_active,
    matchCount: matchCountMap.get(row.id) ?? 0,
  }));
}

function buildLegacyCourtNote({
  directions,
  parking,
  smoking,
  shower_locker,
}: Pick<VenueRow, "directions" | "parking" | "smoking" | "shower_locker">) {
  return [
    ["찾아오는 길", directions],
    ["주차", parking],
    ["흡연", smoking],
    ["보관/샤워", shower_locker],
  ]
    .flatMap(([label, value]) => {
      const text = value?.trim();
      return text ? [`${label}: ${text}`] : [];
    })
    .join("\n");
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
