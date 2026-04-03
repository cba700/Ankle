import { HomePage } from "@/components/home/home-page";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";
import { getServerAuthState } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { configured, role, user } = await getServerAuthState();
  const matches = await getPublicMatches();
  const dates = getDisplayDates();
  const myPageHref = user
    ? "/mypage"
    : buildLoginHref(
        "/mypage",
        configured ? undefined : "supabase_not_configured",
      );

  return (
    <HomePage
      isAdmin={role === "admin"}
      matches={matches}
      dates={dates}
      myPageHref={myPageHref}
    />
  );
}
