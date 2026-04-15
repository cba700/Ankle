import { NextResponse } from "next/server";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  buildLoginHref,
  normalizePostAuthNextPath,
} from "@/lib/auth/redirect";
import {
  bindSingleSessionCookie,
  createSingleSessionBinding,
} from "@/lib/auth/single-session";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getServerUserState } from "@/lib/supabase/auth";
import { assertSignupProfileSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getRequiredSignupProfileHref,
  refreshSignupProfileCompletionStatus,
} from "@/lib/signup-profile-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = normalizePostAuthNextPath(requestUrl.searchParams.get("next"));
  const { configured, user } = await getServerUserState();

  if (!configured || !user) {
    return NextResponse.redirect(
      new URL(
        buildLoginHref(nextPath, configured ? undefined : "supabase_not_configured"),
        requestUrl.origin,
      ),
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: 303,
      },
    );
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(
      new URL(buildLoginHref(nextPath, "supabase_not_configured"), requestUrl.origin),
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: 303,
      },
    );
  }

  await assertSignupProfileSchemaReady(supabase);
  const sessionKey = await createSingleSessionBinding(supabase as any, user.id);
  const signupProfileState = await refreshSignupProfileCompletionStatus(
    supabase as any,
    user.id,
  );
  const requiredSignupProfileHref = getRequiredSignupProfileHref(
    signupProfileState,
    nextPath,
  );

  if (requiredSignupProfileHref) {
    const response = NextResponse.redirect(
      new URL(requiredSignupProfileHref, requestUrl.origin),
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: 303,
      },
    );

    bindSingleSessionCookie(response, sessionKey);
    return response;
  }

  const requiredSetupHref = await getRequiredMemberSetupRedirectPath(
    supabase,
    user.id,
    nextPath,
    { skipPhoneVerification: true },
  );

  const response = NextResponse.redirect(
    new URL(requiredSetupHref ?? nextPath, requestUrl.origin),
    {
      headers: PRIVATE_NO_STORE_HEADERS,
      status: 303,
    },
  );

  bindSingleSessionCookie(response, sessionKey);
  return response;
}
