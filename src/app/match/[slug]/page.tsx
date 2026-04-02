import { notFound } from "next/navigation";
import { MatchDetail } from "@/components/match/match-detail";
import { getMatchBySlug } from "@/lib/matches";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  return <MatchDetail match={match} />;
}

