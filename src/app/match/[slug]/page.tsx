import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MatchDetail } from "@/components/match/match-detail";
import { getPublicMatchByPublicId } from "@/lib/matches-data";
import {
  SITE_LOCALE,
  SITE_NAME,
  getMainOgImageUrl,
  resolveSiteUrl,
} from "@/lib/site-metadata";

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

  const canonicalPath = `/match/${publicId}`;
  const description = `${match.dateLabel} ${match.time} · ${match.venueName}`;
  const title = `${match.title} | ${match.dateLabel} ${match.time}`;
  const imageUrl = match.imageUrls[0]
    ? resolveSiteUrl(match.imageUrls[0])
    : getMainOgImageUrl();

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "website",
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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
