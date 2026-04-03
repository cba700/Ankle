import { HomePage } from "@/components/home/home-page";
import { buildHomeMatchRows } from "@/components/home/home-view-model";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getDisplayDates } from "@/lib/matches";
import { getPublicMatches } from "@/lib/matches-data";
import { getServerAuthState } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { configured, role, user } = await getServerAuthState();
  const matches = await getPublicMatches();
  const rows = buildHomeMatchRows(matches);
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
      dates={dates}
      myPageHref={myPageHref}
      rows={rows}
    />
  );
}
