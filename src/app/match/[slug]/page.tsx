import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MatchDetail } from "@/components/match/match-detail";
import { formatMoney } from "@/lib/date";
import { getPublicMatchByPublicId } from "@/lib/matches-data";

export const revalidate = 60;

const getMatch = cache((publicId: string) => getPublicMatchByPublicId(publicId));

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: publicId } = await params;
  const match = await getMatch(publicId);

  if (!match) {
    return {
      title: "매치 상세",
      description: "앵클 농구 매치 상세 정보 페이지",
    };
  }

  const description = [
    `${match.dateLabel} ${match.time}`,
    match.venueName,
    match.levelCondition,
    match.genderCondition,
    `참가비 ${formatMoney(match.price)}원`,
  ].join(" · ");
  const title = `${match.title} | ${match.dateLabel} ${match.time}`;
  const imageUrl = match.imageUrls.find(isAbsoluteUrl);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
  };
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: publicId } = await params;
  const match = await getMatch(publicId);

  if (!match) {
    notFound();
  }

  return <MatchDetail match={match} />;
}

function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}
