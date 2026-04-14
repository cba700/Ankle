const DEFAULT_NEXT_PATH = "/";

const INVALID_POST_AUTH_PREFIXES = [
  "/auth/continue",
  "/login",
  "/signup",
  "/verify-phone",
];

export function normalizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return DEFAULT_NEXT_PATH;
  }

  return nextPath;
}

export function normalizeWelcomeNextPath(nextPath?: string | null) {
  const normalizedNextPath = normalizePostAuthNextPath(nextPath);

  if (normalizedNextPath.startsWith("/welcome")) {
    return DEFAULT_NEXT_PATH;
  }

  return normalizedNextPath;
}

export function normalizeVerifyPhoneNextPath(nextPath?: string | null) {
  const normalizedNextPath = normalizePostAuthNextPath(nextPath);

  if (normalizedNextPath.startsWith("/verify-phone")) {
    return DEFAULT_NEXT_PATH;
  }

  return normalizedNextPath;
}

export function normalizePostAuthNextPath(nextPath?: string | null) {
  const normalizedNextPath = normalizeNextPath(nextPath);

  if (
    INVALID_POST_AUTH_PREFIXES.some((prefix) =>
      normalizedNextPath.startsWith(prefix),
    )
  ) {
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

export function buildVerifyPhoneHref(nextPath?: string | null) {
  const params = new URLSearchParams();
  const normalizedNextPath = normalizeVerifyPhoneNextPath(nextPath);

  if (normalizedNextPath !== DEFAULT_NEXT_PATH) {
    params.set("next", normalizedNextPath);
  }

  const query = params.toString();
  return query ? `/verify-phone?${query}` : "/verify-phone";
}

export function buildAuthContinueHref(nextPath?: string | null) {
  const params = new URLSearchParams();
  const normalizedNextPath = normalizePostAuthNextPath(nextPath);

  if (normalizedNextPath !== DEFAULT_NEXT_PATH) {
    params.set("next", normalizedNextPath);
  }

  const query = params.toString();
  return query ? `/auth/continue?${query}` : "/auth/continue";
}
