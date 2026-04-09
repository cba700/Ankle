import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

export const SITE_NAME = "앵클";
export const SITE_DESCRIPTION = "혼자 와도 바로 참여할 수 있는 서울 한강 농구 매칭 플랫폼";
export const SITE_LOCALE = "ko_KR";

const DEFAULT_SITE_URL = "https://ankle-phi.vercel.app";
const MAIN_OG_IMAGE_FILENAMES = ["og-main.jpg", "og-main.png"];
const MAIN_OG_IMAGE_FALLBACK_PATH = "/court-a.svg";

export function getSiteMetadataBase() {
  return new URL(getSiteUrl());
}

export function resolveSiteUrl(pathOrUrl: string) {
  if (isAbsoluteUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(normalizedPath, getSiteUrl()).toString();
}

export function getMainOgImagePath() {
  const mainOgImageFilename = getMainOgImageFilename();

  return mainOgImageFilename ? `/${mainOgImageFilename}` : MAIN_OG_IMAGE_FALLBACK_PATH;
}

export function getMainOgImageUrl() {
  return resolveSiteUrl(getMainOgImagePath());
}

function getSiteUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredSiteUrl) {
    return DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(configuredSiteUrl);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function getMainOgImageFilename() {
  return MAIN_OG_IMAGE_FILENAMES.find((filename) =>
    existsSync(join(process.cwd(), "public", filename)),
  );
}

function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}
