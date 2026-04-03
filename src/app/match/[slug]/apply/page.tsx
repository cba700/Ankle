import { notFound, redirect } from "next/navigation";
import { MatchApplyPage } from "@/components/match/match-apply-page";
import { buildMatchDetailViewModel } from "@/components/match/match-detail-view-model";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getMatchBySlug } from "@/lib/matches";
import { getServerAuthState } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function MatchApply({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

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

  return (
    <MatchApplyPage
      accountLabel={accountLabel}
      isClosed={match.status.kind === "closed"}
      view={buildMatchDetailViewModel(match)}
    />
  );
}
