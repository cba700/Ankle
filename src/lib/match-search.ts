import type { MatchRecord } from "@/lib/matches";

export type PublicMatchSearchItem = {
  address: string;
  dateKey: string;
  dateLabel: string;
  district: string;
  isClosed: boolean;
  publicId: string;
  statusLabel: string;
  time: string;
  title: string;
  venueName: string;
};

const AREA_KEYWORDS = ["한강", "중랑천", "탄천", "안양천", "청계천"] as const;

export function normalizeSearchQuery(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("ko-KR");
}

export function buildPublicMatchSearchItems(matches: MatchRecord[]): PublicMatchSearchItem[] {
  return matches.map((match) => ({
    address: match.address,
    dateKey: match.dateKey,
    dateLabel: match.dateLabel,
    district: match.district,
    isClosed: !match.canApply,
    publicId: match.publicId,
    statusLabel: match.status.label,
    time: match.time,
    title: match.title,
    venueName: match.venueName,
  }));
}

export function filterPublicMatchSearchItems(
  items: PublicMatchSearchItem[],
  query: string,
) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  return items
    .map((item) => ({
      item,
      score: getMatchScore(item, normalizedQuery),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      if (left.item.isClosed !== right.item.isClosed) {
        return left.item.isClosed ? 1 : -1;
      }

      if (left.item.dateKey !== right.item.dateKey) {
        return left.item.dateKey.localeCompare(right.item.dateKey);
      }

      if (left.item.time !== right.item.time) {
        return left.item.time.localeCompare(right.item.time);
      }

      return left.item.title.localeCompare(right.item.title, "ko");
    })
    .map((entry) => entry.item);
}

function getMatchScore(item: PublicMatchSearchItem, normalizedQuery: string) {
  const fields = [
    { value: item.title, weight: 0 },
    { value: item.venueName, weight: 8 },
    { value: item.district, weight: 16 },
    { value: item.address, weight: 24 },
    ...getAreaKeywords(item).map((value) => ({ value, weight: 20 })),
  ];

  return fields.reduce((bestScore, field) => {
    const score = getFieldScore(field.value, normalizedQuery, field.weight);
    return score < bestScore ? score : bestScore;
  }, Number.POSITIVE_INFINITY);
}

function getFieldScore(value: string, normalizedQuery: string, weight: number) {
  const normalizedValue = normalizeSearchQuery(value);

  if (!normalizedValue) {
    return Number.POSITIVE_INFINITY;
  }

  const compactValue = compactSearchValue(normalizedValue);
  const compactQuery = compactSearchValue(normalizedQuery);

  if (normalizedValue === normalizedQuery || compactValue === compactQuery) {
    return weight;
  }

  if (
    normalizedValue.startsWith(normalizedQuery)
    || compactValue.startsWith(compactQuery)
  ) {
    return weight + 20;
  }

  const includesIndex = normalizedValue.indexOf(normalizedQuery);

  if (includesIndex >= 0) {
    return weight + 40 + includesIndex;
  }

  const compactIncludesIndex = compactValue.indexOf(compactQuery);

  if (compactIncludesIndex >= 0) {
    return weight + 60 + compactIncludesIndex;
  }

  return Number.POSITIVE_INFINITY;
}

function getAreaKeywords(item: Pick<PublicMatchSearchItem, "address" | "venueName">) {
  const searchText = `${item.venueName} ${item.address}`;

  return AREA_KEYWORDS.filter((keyword) => searchText.includes(keyword));
}

function compactSearchValue(value: string) {
  return normalizeSearchQuery(value).replace(/\s/g, "");
}
