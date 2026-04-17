import { NextResponse } from "next/server";
import { clearSingleSessionCookie } from "@/lib/auth/single-session";
import { ensureAuthUserBootstrap } from "@/lib/auth/user-bootstrap";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  buildAuthContinueHref,
  buildLoginHref,
  normalizeNextPath,
} from "@/lib/auth/redirect";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { syncKakaoSignupProfile } from "@/lib/signup-profile-server";

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "oauth_failed"), requestUrl.origin),
      { headers: PRIVATE_NO_STORE_HEADERS, status: 303 },
    );
  }

  if (!data.user) {
    return buildAccountSetupFailedResponse({
      nextPath,
      requestUrl,
      supabase,
    });
  }

  try {
    await ensureAuthUserBootstrap(data.user);
  } catch (bootstrapError) {
    console.error("[auth-bootstrap]", {
      message: toErrorMessage(bootstrapError),
      nextPath,
      provider: isKakaoUser(data.user) ? "kakao" : "oauth",
      stage: "callback",
      userId: data.user.id,
    });

    return buildAccountSetupFailedResponse({
      nextPath,
      requestUrl,
      supabase,
    });
  }

  if (
    data.session?.provider_token &&
    data.user &&
    isKakaoUser(data.user)
  ) {
    try {
      await syncKakaoSignupProfile(supabase as any, {
        providerToken: data.session.provider_token,
        userId: data.user.id,
      });
    } catch (syncError) {
      console.error("[auth-callback:kakao-sync]", {
        message: toErrorMessage(syncError),
        nextPath,
        provider: "kakao",
        stage: "callback",
        userId: data.user.id,
      });
    }
  }

  return NextResponse.redirect(new URL(buildAuthContinueHref(nextPath), requestUrl.origin), {
    headers: PRIVATE_NO_STORE_HEADERS,
    status: 303,
  });
}

async function buildAccountSetupFailedResponse({
  nextPath,
  requestUrl,
  supabase,
}: {
  nextPath: string;
  requestUrl: URL;
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>;
}) {
  await supabase.auth.signOut();

  const response = NextResponse.redirect(
    new URL(buildLoginHref(nextPath, "account_setup_failed"), requestUrl.origin),
    {
      headers: PRIVATE_NO_STORE_HEADERS,
      status: 303,
    },
  );

  clearSingleSessionCookie(response);
  return response;
}

function isKakaoUser(user: {
  app_metadata?: {
    provider?: unknown;
    providers?: unknown;
  };
}) {
  if (user.app_metadata?.provider === "kakao") {
    return true;
  }

  return Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.includes("kakao")
    : false;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
