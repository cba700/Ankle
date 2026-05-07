import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";
import {
  SITE_LOCALE,
  SITE_NAME,
  getMainOgImageUrl,
} from "@/lib/site-metadata";

const title = "앵클 소개";
const description =
  "날짜와 레벨만 고르면 바로 참여할 수 있는 앵클 농구 매칭 플랫폼 소개";
const mainOgImageUrl = getMainOgImageUrl();

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: "/about",
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    images: [{ url: mainOgImageUrl }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [mainOgImageUrl],
  },
};

export default function AboutRoute() {
  return <AboutPage />;
}
