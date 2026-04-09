"use client";

import { useSearchParams } from "next/navigation";
import {
  getHomeStateHref,
  parseHomeFilterIds,
} from "@/components/home/home-route-state";
import { AppLink } from "@/components/navigation/app-link";

type MatchDetailBackLinkProps = {
  className?: string;
};

export function MatchDetailBackLink({ className }: MatchDetailBackLinkProps) {
  const searchParams = useSearchParams();
  const backHref = getHomeStateHref({
    dateKey: searchParams.get("date") ?? undefined,
    filterIds: parseHomeFilterIds(
      searchParams.get("filters") ?? undefined,
      ["hideClosed", "region", "gender", "level", "shade"],
    ),
  });

  return (
    <AppLink className={className} href={backHref}>
      ← 매치 목록으로
    </AppLink>
  );
}
