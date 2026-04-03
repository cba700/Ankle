import { HomePage } from "@/components/home/home-page";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const matches = await getPublicMatches();
  const dates = getDisplayDates();

  return <HomePage matches={matches} dates={dates} />;
}
