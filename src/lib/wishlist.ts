import "server-only";

import { formatDateLabel, formatMoney, formatSeoulTime } from "@/lib/date";
import { assertMatchWishlistSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type WishlistStoreClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

type WishlistMatchRow = {
  format: "3vs3" | "5vs5";
  id: string;
  price: number;
  public_id: string | null;
  start_at: string;
  status: "cancelled" | "closed" | "draft" | "open";
  title: string | null;
  venue_name: string | null;
};

type WishlistRow = {
  created_at: string;
  match: WishlistMatchRow | WishlistMatchRow[] | null;
  match_id: string;
};

export type WishlistMatch = {
  dateTimeLabel: string;
  href: string | null;
  id: string;
  metaLabel: string;
  priceLabel: string;
  statusLabel: string;
  statusTone: "accent" | "muted";
  title: string;
  venueName: string;
};

const WISHLIST_MATCH_SELECT = `
  created_at,
  match_id,
  match:matches!match_wishlist_items_match_id_fkey (
    id,
    public_id,
    start_at,
    status,
    title,
    venue_name,
    format,
    price
  )
`;

export async function listWishlistMatchIdsByUserId(
  userId: string,
  supabase?: WishlistStoreClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return [];
  }

  await assertMatchWishlistSchemaReady(client);

  const { data, error } = await client
    .from("match_wishlist_items")
    .select("match_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load wishlist ids: ${error.message}`);
  }

  return Array.from(
    new Set(
      ((data ?? []) as Array<{ match_id: string }>).map((row) => row.match_id),
    ),
  );
}

export async function listWishlistMatchesByUserId(
  userId: string,
  supabase?: WishlistStoreClient | null,
): Promise<WishlistMatch[]> {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return [];
  }

  await assertMatchWishlistSchemaReady(client);

  const { data, error } = await client
    .from("match_wishlist_items")
    .select(WISHLIST_MATCH_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load wishlist matches: ${error.message}`);
  }

  return ((data ?? []) as WishlistRow[])
    .map((row) => normalizeWishlistMatch(row))
    .filter((row): row is WishlistMatchRow => row !== null)
    .filter(isPublicWishlistMatch)
    .sort((left, right) => left.start_at.localeCompare(right.start_at))
    .map((match) => mapWishlistMatch(match));
}

function normalizeWishlistMatch(row: WishlistRow) {
  if (!row.match) {
    return null;
  }

  return Array.isArray(row.match) ? row.match[0] ?? null : row.match;
}

function isPublicWishlistMatch(match: WishlistMatchRow) {
  return (
    (match.status === "open" || match.status === "closed") &&
    new Date(match.start_at).getTime() >= Date.now()
  );
}

function mapWishlistMatch(match: WishlistMatchRow): WishlistMatch {
  const startAt = new Date(match.start_at);

  return {
    dateTimeLabel: `${formatDateLabel(startAt)} ${formatSeoulTime(startAt)}`,
    href: match.public_id ? `/match/${match.public_id}` : null,
    id: match.id,
    metaLabel: `${match.venue_name?.trim() || "장소 정보 확인 불가"} · ${formatMatchFormat(match.format)}`,
    priceLabel: `${formatMoney(match.price)}원`,
    statusLabel: match.status === "closed" ? "마감" : "모집 중",
    statusTone: match.status === "closed" ? "muted" : "accent",
    title: match.title?.trim() || "매치 정보 확인 불가",
    venueName: match.venue_name?.trim() || "장소 정보 확인 불가",
  };
}

function formatMatchFormat(format: WishlistMatchRow["format"]) {
  return format === "5vs5" ? "5vs5" : "3vs3";
}
