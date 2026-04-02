import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { buildLoginHref } from "@/lib/auth/redirect";
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

  if (!request.nextUrl.pathname.startsWith("/admin") || user) {
    return response;
  }

  return NextResponse.redirect(
    new URL(buildLoginHref(requestPath), request.url),
  );
}
