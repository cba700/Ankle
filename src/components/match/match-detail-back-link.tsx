"use client";

import { useSearchParams } from "next/navigation";
import { normalizeSearchQuery } from "@/lib/match-search";
import {
  getHomeStateHref,
  parseHomeMultiValueParam,
  parseHomeToggleParam,
  HOME_GENDER_FILTER_VALUES,
  HOME_LEVEL_FILTER_VALUES,
} from "@/components/home/home-route-state";
import { SEOUL_DISTRICTS } from "@/components/home/home-view-model";
import { AppLink } from "@/components/navigation/app-link";

type MatchDetailBackLinkProps = {
  className?: string;
};

export function MatchDetailBackLink({ className }: MatchDetailBackLinkProps) {
  const searchParams = useSearchParams();
  const backHref = getHomeStateHref({
    districts: parseHomeMultiValueParam(
      searchParams.get("districts") ?? undefined,
      SEOUL_DISTRICTS,
    ),
    genders: parseHomeMultiValueParam(
      searchParams.get("genders") ?? undefined,
      HOME_GENDER_FILTER_VALUES,
    ),
    hideClosed: parseHomeToggleParam(
      searchParams.get("hideClosed") ?? undefined,
    ),
    levels: parseHomeMultiValueParam(
      searchParams.get("levels") ?? undefined,
      HOME_LEVEL_FILTER_VALUES,
    ),
    query: normalizeSearchQuery(searchParams.get("q") ?? undefined),
  });

  return (
    <AppLink className={className} href={backHref}>
      ← 매치 목록으로
    </AppLink>
  );
}
