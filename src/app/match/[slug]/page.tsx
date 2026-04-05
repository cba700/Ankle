import { notFound } from "next/navigation";
import { MatchDetail } from "@/components/match/match-detail";
import { getPublicMatchBySlug } from "@/lib/matches-data";

export const revalidate = 60;

export function generateStaticParams() {
  return [];
}

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
