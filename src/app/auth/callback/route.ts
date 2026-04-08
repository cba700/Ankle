import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { buildLoginHref, normalizeNextPath } from "@/lib/auth/redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "oauth_failed"), requestUrl.origin),
      { headers: PRIVATE_NO_STORE_HEADERS, status: 303 },
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "supabase_not_configured"), requestUrl.origin),
      { headers: PRIVATE_NO_STORE_HEADERS, status: 303 },
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "callback_code_missing"), requestUrl.origin),
      { headers: PRIVATE_NO_STORE_HEADERS, status: 303 },
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "oauth_failed"), requestUrl.origin),
      { headers: PRIVATE_NO_STORE_HEADERS, status: 303 },
    );
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin), {
    headers: PRIVATE_NO_STORE_HEADERS,
    status: 303,
  });
}
