import { notFound } from "next/navigation";
import { MatchDetail } from "@/components/match/match-detail";
import { getPublicMatchBySlug } from "@/lib/matches-data";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = await getPublicMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  return <MatchDetail match={match} />;
}
