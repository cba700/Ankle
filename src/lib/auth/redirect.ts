const DEFAULT_NEXT_PATH = "/";

export function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return nextPath;
}

export function normalizeWelcomeNextPath(nextPath?: string | null) {
  const normalizedNextPath = normalizeNextPath(nextPath);

  if (normalizedNextPath.startsWith("/welcome")) {
    return DEFAULT_NEXT_PATH;
  }

  return normalizedNextPath;
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

export function buildWelcomeHref(nextPath?: string | null) {
  const params = new URLSearchParams();
  const normalizedNextPath = normalizeWelcomeNextPath(nextPath);

  if (normalizedNextPath !== DEFAULT_NEXT_PATH) {
    params.set("next", normalizedNextPath);
  }

  const query = params.toString();
  return query ? `/welcome?${query}` : "/welcome";
}
