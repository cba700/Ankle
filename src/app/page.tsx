import { HomePage } from "@/components/home/home-page";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";
import { getServerAuthState } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { role } = await getServerAuthState();
  const matches = await getPublicMatches();
  const dates = getDisplayDates();

  return <HomePage isAdmin={role === "admin"} matches={matches} dates={dates} />;
}
