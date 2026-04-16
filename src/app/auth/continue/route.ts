import { NextResponse } from "next/server";
import {
  getAccountStatusLoginErrorCode,
} from "@/lib/account-withdrawal";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  buildLoginHref,
  normalizePostAuthNextPath,
} from "@/lib/auth/redirect";
import {
  bindSingleSessionCookie,
  clearSingleSessionCookie,
  createSingleSessionBinding,
} from "@/lib/auth/single-session";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { getServerUserState } from "@/lib/supabase/auth";
import {
  assertAccountWithdrawalSchemaReady,
  assertSignupProfileSchemaReady,
} from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getRequiredSignupProfileHref,
  refreshSignupProfileCompletionStatus,
} from "@/lib/signup-profile-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = normalizePostAuthNextPath(requestUrl.searchParams.get("next"));
  const { accountStatus, configured, user } = await getServerUserState();

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

  await assertAccountWithdrawalSchemaReady(supabase);

  if (accountStatus !== "active") {
    if (accountStatus === "withdrawn") {
      const { error } = await supabase.rpc("reactivate_withdrawn_account");

      if (!error) {
        return continueWithActiveAccount({
          nextPath,
          requestUrl,
          supabase,
          userId: user.id,
        });
      }
    }

    await supabase.auth.signOut();
    const response = NextResponse.redirect(
      new URL(
        buildLoginHref(nextPath, getAccountStatusLoginErrorCode(accountStatus)),
        requestUrl.origin,
      ),
      {
        headers: PRIVATE_NO_STORE_HEADERS,
        status: 303,
      },
    );

    clearSingleSessionCookie(response);
    return response;
  }

  return continueWithActiveAccount({
    nextPath,
    requestUrl,
    supabase,
    userId: user.id,
  });
}

async function continueWithActiveAccount({
  nextPath,
  requestUrl,
  supabase,
  userId,
}: {
  nextPath: string;
  requestUrl: URL;
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>;
  userId: string;
}) {
  await assertSignupProfileSchemaReady(supabase);
  const sessionKey = await createSingleSessionBinding(supabase as any, userId);
  const signupProfileState = await refreshSignupProfileCompletionStatus(
    supabase as any,
    userId,
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
    userId,
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
