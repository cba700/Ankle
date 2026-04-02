import { HomePage } from "@/components/home/home-page";
import { getDisplayDates, getMatches } from "@/lib/matches";

export const dynamic = "force-dynamic";

export default function Page() {
  const matches = getMatches();
  const dates = getDisplayDates();

  return <HomePage matches={matches} dates={dates} />;
}

