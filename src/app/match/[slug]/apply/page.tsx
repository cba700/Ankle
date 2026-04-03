import { notFound, redirect } from "next/navigation";
import { MatchApplyPage } from "@/components/match/match-apply-page";
import { buildMatchDetailViewModel } from "@/components/match/match-detail-view-model";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getPublicMatchBySlug } from "@/lib/matches-data";
import { getServerAuthState } from "@/lib/supabase/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MatchApply({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = await getPublicMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  const { configured, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(
      buildLoginHref(
        `/match/${match.slug}/apply`,
        configured ? undefined : "supabase_not_configured",
      ),
    );
  }

  const accountLabel =
    user.email ??
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "카카오 계정");
  const supabase = await getSupabaseServerClient();
  const { data: existingApplication } = supabase
    ? await supabase
        .from("match_applications")
        .select("id")
        .eq("match_id", match.id)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .maybeSingle()
    : { data: null };

  return (
    <MatchApplyPage
      accountLabel={accountLabel}
      alreadyApplied={Boolean(existingApplication)}
      isClosed={match.status.kind === "closed"}
      view={buildMatchDetailViewModel(match)}
    />
  );
}
