type HomeStateInput = {
  dateKey?: string;
  filterIds?: string[];
};

export function getFirstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parseHomeFilterIds(
  value: string | undefined,
  allowedFilterIds: readonly string[],
) {
  if (!value) {
    return [];
  }

  const allowedIds = new Set(allowedFilterIds);

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item, index, items) => item && allowedIds.has(item) && items.indexOf(item) === index);
}

export function getHomeStateSearch({
  dateKey,
  filterIds = [],
}: HomeStateInput) {
  const searchParams = new URLSearchParams();

  if (dateKey) {
    searchParams.set("date", dateKey);
  }

  if (filterIds.length > 0) {
    searchParams.set("filters", filterIds.join(","));
  }

  const search = searchParams.toString();

  return search ? `?${search}` : "";
}

export function getHomeStateHref(state: HomeStateInput) {
  const search = getHomeStateSearch(state);

  return search ? `/${search}` : "/";
}
