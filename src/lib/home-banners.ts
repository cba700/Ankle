import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabasePublicServerClient } from "@/lib/supabase/server";

export type HomeBanner = {
  id: string;
  title: string;
  imageUrl: string;
  href: string;
  displayOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicHomeBanner = Pick<HomeBanner, "href" | "id" | "imageUrl" | "title">;

type HomeBannerRow = {
  id: string;
  title: string;
  image_url: string;
  href: string;
  display_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listPublicHomeBanners(): Promise<PublicHomeBanner[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabasePublicServerClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await ((supabase.from("home_banners" as any) as any)
    .select("id, title, image_url, href, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true }));

  if (error) {
    return [];
  }

  return ((data ?? []) as Pick<
    HomeBannerRow,
    "display_order" | "href" | "id" | "image_url" | "title"
  >[])
    .map((row) => ({
      href: row.href,
      id: row.id,
      imageUrl: row.image_url,
      title: row.title,
    }))
    .filter((banner) => banner.imageUrl && banner.href && banner.title);
}

export async function listAdminHomeBanners(supabase: any): Promise<HomeBanner[]> {
  const { data, error } = await ((supabase.from("home_banners" as any) as any)
    .select(
      "id, title, image_url, href, display_order, is_active, starts_at, ends_at, created_at, updated_at",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true }));

  if (error) {
    throw new Error(`Failed to load home banners: ${error.message}`);
  }

  return ((data ?? []) as HomeBannerRow[]).map(mapHomeBannerRow);
}

export async function getAdminHomeBannerById(
  supabase: any,
  bannerId: string,
): Promise<HomeBanner | null> {
  const { data, error } = await ((supabase.from("home_banners" as any) as any)
    .select(
      "id, title, image_url, href, display_order, is_active, starts_at, ends_at, created_at, updated_at",
    )
    .eq("id", bannerId)
    .maybeSingle());

  if (error) {
    throw new Error(`Failed to load home banner: ${error.message}`);
  }

  return data ? mapHomeBannerRow(data as HomeBannerRow) : null;
}

function mapHomeBannerRow(row: HomeBannerRow): HomeBanner {
  return {
    createdAt: row.created_at,
    displayOrder: row.display_order,
    endsAt: row.ends_at,
    href: row.href,
    id: row.id,
    imageUrl: row.image_url,
    isActive: row.is_active,
    startsAt: row.starts_at,
    title: row.title,
    updatedAt: row.updated_at,
  };
}
