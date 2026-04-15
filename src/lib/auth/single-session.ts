import type { NextRequest, NextResponse } from "next/server";

const SINGLE_SESSION_COOKIE_NAME = "ankle_session_key";
const SINGLE_SESSION_REQUIRED_MIGRATION =
  "20260415170000_add_profile_active_session_key.sql";

export function bindSingleSessionCookie(response: NextResponse, sessionKey: string) {
  response.cookies.set(SINGLE_SESSION_COOKIE_NAME, sessionKey, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function createSingleSessionBinding(
  supabase: {
    from: (table: string) => {
      update: (values: Record<string, unknown>) => {
        eq: (
          column: string,
          value: string,
        ) => Promise<{ error: { code?: string; message?: string } | null }>;
      };
    };
  },
  userId: string,
) {
  const sessionKey = crypto.randomUUID();
  const { error } = await supabase
    .from("profiles")
    .update({ active_session_key: sessionKey })
    .eq("id", userId);

  if (error) {
    if (
      error.code === "42703" ||
      error.message?.includes("active_session_key") ||
      error.message?.includes("does not exist")
    ) {
      throw new Error(
        `Database schema is outdated. Apply migration ${SINGLE_SESSION_REQUIRED_MIGRATION} before running single-session enforcement.`,
      );
    }

    throw new Error(`Failed to bind active session: ${error.message}`);
  }

  return sessionKey;
}

export function clearSingleSessionCookie(response: NextResponse) {
  response.cookies.set(SINGLE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
}

export function getSingleSessionCookieValue(request: NextRequest) {
  return request.cookies.get(SINGLE_SESSION_COOKIE_NAME)?.value ?? null;
}
