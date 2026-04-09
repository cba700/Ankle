import { HomePage } from "@/components/home/home-page";
import { getFirstSearchParam, parseHomeFilterIds } from "@/components/home/home-route-state";
import { buildHomeMatchRows } from "@/components/home/home-view-model";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";

export const revalidate = 60;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string | string[];
    filters?: string | string[];
  }>;
}) {
  const matches = await getPublicMatches();
  const rows = buildHomeMatchRows(matches);
  const dates = getDisplayDates();
  const resolvedSearchParams = await searchParams;
  const requestedDateKey = getFirstSearchParam(resolvedSearchParams.date);
  const initialSelectedDateKey = dates.some((date) => date.key === requestedDateKey)
    ? requestedDateKey ?? ""
    : dates[0]?.key ?? "";
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
