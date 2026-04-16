import { normalizeSearchQuery } from "@/lib/match-search";
import type {
  HomeFilterState,
  HomeGenderFilterKey,
  HomeLevelFilterKey,
} from "./home-types";

export const HOME_RESET_TO_TODAY_EVENT = "ankle:home-reset-to-today";

export const HOME_GENDER_FILTER_VALUES: readonly HomeGenderFilterKey[] = [
  "male",
  "female",
  "mixed",
];

export const HOME_LEVEL_FILTER_VALUES: readonly HomeLevelFilterKey[] = [
  "basic",
  "middle",
  "high",
  "star",
];

type HomeStateInput = HomeFilterState & {
  query?: string;
};

export function getFirstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseHomeToggleParam(value: string | undefined) {
  return value === "1";
}

export function parseHomeMultiValueParam<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
) {
  if (!value) {
    return [] as T[];
  }

  const allowedSet = new Set<string>(allowedValues);

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item, index, items) =>
        item && allowedSet.has(item) && items.indexOf(item) === index,
    ) as T[];
}

export function getHomeStateSearch({
  districts,
  genders,
  hideClosed,
  levels,
  query,
}: HomeStateInput) {
  const searchParams = new URLSearchParams();
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  if (hideClosed) {
    searchParams.set("hideClosed", "1");
  }

  if (districts.length > 0) {
    searchParams.set("districts", districts.join(","));
  }

  if (genders.length > 0) {
    searchParams.set("genders", genders.join(","));
  }

  if (levels.length > 0) {
    searchParams.set("levels", levels.join(","));
  }

  const search = searchParams.toString();

  return search ? `?${search}` : "";
}

export function getHomeStateHref(state: HomeStateInput) {
  const search = getHomeStateSearch(state);

  return search ? `/${search}` : "/";
}
