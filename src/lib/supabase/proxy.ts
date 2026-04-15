import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { buildLoginHref } from "@/lib/auth/redirect";
import {
  clearSingleSessionCookie,
  copyResponseCookies,
  getSingleSessionCookieValue,
} from "@/lib/auth/single-session";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { getSupabasePublicEnv } from "./env";

export async function updateSession(request: NextRequest) {
  const requestPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL(buildLoginHref(requestPath, "supabase_not_configured"), request.url),
      );
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("active_session_key")
      .eq("id", user.id)
      .maybeSingle();

    if (!error) {
      const activeSessionKey =
        profile && typeof profile.active_session_key === "string"
          ? profile.active_session_key
          : null;
      const requestSessionKey = getSingleSessionCookieValue(request);

      if (activeSessionKey && activeSessionKey !== requestSessionKey) {
        await supabase.auth.signOut();

        if (request.nextUrl.pathname.startsWith("/api/")) {
          const expiredResponse = NextResponse.json(
            {
              code: "SESSION_EXPIRED",
              message:
                "다른 기기에서 로그인되어 현재 세션이 종료되었습니다. 다시 로그인해 주세요.",
            },
            {
              headers: PRIVATE_NO_STORE_HEADERS,
              status: 401,
            },
          );

          copyResponseCookies(response, expiredResponse);
          clearSingleSessionCookie(expiredResponse);
          return expiredResponse;
        }

        const redirectResponse = NextResponse.redirect(
          new URL(buildLoginHref(requestPath, "session_expired"), request.url),
        );

        copyResponseCookies(response, redirectResponse);
        clearSingleSessionCookie(redirectResponse);
        return redirectResponse;
      }
    }
  }

  if (!request.nextUrl.pathname.startsWith("/admin") || user) {
    if (!user && getSingleSessionCookieValue(request)) {
      clearSingleSessionCookie(response);
    }

    return response;
  }

  return NextResponse.redirect(
    new URL(buildLoginHref(requestPath), request.url),
  );
}
