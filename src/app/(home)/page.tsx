import type { Metadata } from "next";
import { HomePage } from "@/components/home/home-page";
import { getFirstSearchParam, parseHomeFilterIds } from "@/components/home/home-route-state";
import { buildHomeMatchRows } from "@/components/home/home-view-model";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  getMainOgImageUrl,
} from "@/lib/site-metadata";

export const revalidate = 60;

const mainOgImageUrl = getMainOgImageUrl();

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [{ url: mainOgImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [mainOgImageUrl],
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    filters?: string | string[];
  }>;
}) {
  const matches = await getPublicMatches();
  const rows = buildHomeMatchRows(matches);
  const dates = getDisplayDates();
  const resolvedSearchParams = await searchParams;
  const initialSelectedDateKey = dates[0]?.key ?? "";
  const initialActiveFilterIds = parseHomeFilterIds(
    getFirstSearchParam(resolvedSearchParams.filters),
    ["hideClosed", "region", "gender", "level", "shade"],
  );

  return (
    <HomePage
      initialActiveFilterIds={initialActiveFilterIds}
      initialSelectedDateKey={initialSelectedDateKey}
      isAdmin={false}
      dates={dates}
      rows={rows}
    />
  );
}
