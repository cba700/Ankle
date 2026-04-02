const DEFAULT_NEXT_PATH = "/";

export function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return nextPath;
}

export function buildLoginHref(nextPath?: string | null, error?: string) {
  const params = new URLSearchParams();
  const normalizedNextPath = normalizeNextPath(nextPath);

  if (normalizedNextPath !== DEFAULT_NEXT_PATH) {
    params.set("next", normalizedNextPath);
  }

  if (error) {
    params.set("error", error);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}
