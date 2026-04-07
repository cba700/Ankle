import { HomePage } from "@/components/home/home-page";
import { buildHomeMatchRows } from "@/components/home/home-view-model";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";

export const revalidate = 60;

export default async function Page() {
  const matches = await getPublicMatches();
  const rows = buildHomeMatchRows(matches);
  const dates = getDisplayDates();

  return (
    <HomePage
      isAdmin={false}
      dates={dates}
      myPageHref="/mypage"
      rows={rows}
    />
  );
}
