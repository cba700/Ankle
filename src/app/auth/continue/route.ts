import { NextResponse } from "next/server";
import {
  type AccountStatus,
  getAccountStatusLoginErrorCode,
  normalizeAccountStatus,
} from "@/lib/account-withdrawal";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import {
  buildLoginHref,
  normalizePostAuthNextPath,
  shouldRequirePhoneVerificationBeforeContinue,
} from "@/lib/auth/redirect";
import {
  bindSingleSessionCookie,
  clearSingleSessionCookie,
  createSingleSessionBinding,
} from "@/lib/auth/single-session";
import { ensureAuthUserBootstrap } from "@/lib/auth/user-bootstrap";
import { getRequiredMemberSetupRedirectPath } from "@/lib/member-access";
import { normalizeReferralCode } from "@/lib/referral-code";
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
  const referralCode = normalizeReferralCode(requestUrl.searchParams.get("ref"));
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

  await assertAccountWithdrawalSchemaReady(supabase);

  try {
    await ensureAuthUserBootstrap(user);
  } catch (bootstrapError) {
    console.error("[auth-bootstrap]", {
      message: toErrorMessage(bootstrapError),
      nextPath,
      provider: "session",
      stage: "continue",
      userId: user.id,
    });

    return buildAccountSetupFailedResponse({
      nextPath,
      requestUrl,
      supabase,
    });
  }

  let accountStatus: AccountStatus;

  try {
    accountStatus = await loadAccountStatus(supabase, user.id);
  } catch (profileError) {
    console.error("[auth-continue]", {
      message: toErrorMessage(profileError),
      nextPath,
      provider: "session",
      stage: "load_profile",
      userId: user.id,
    });

    return buildAccountSetupFailedResponse({
      nextPath,
      requestUrl,
      supabase,
    });
  }

  if (accountStatus !== "active") {
    if (accountStatus === "withdrawn") {
      const { error } = await supabase.rpc("reactivate_withdrawn_account");

      if (!error) {
        try {
          return await continueWithActiveAccount({
            nextPath,
            referralCode,
            requestUrl,
            supabase,
            userId: user.id,
          });
        } catch (continueError) {
          console.error("[auth-continue]", {
            message: toErrorMessage(continueError),
            nextPath,
            provider: "session",
            stage: "reactivated_continue",
            userId: user.id,
          });

          return buildAccountSetupFailedResponse({
            nextPath,
            requestUrl,
            supabase,
          });
        }
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

  try {
    return await continueWithActiveAccount({
      nextPath,
      referralCode,
      requestUrl,
      supabase,
      userId: user.id,
    });
  } catch (continueError) {
    console.error("[auth-continue]", {
      message: toErrorMessage(continueError),
      nextPath,
      provider: "session",
      stage: "continue",
      userId: user.id,
    });

    return buildAccountSetupFailedResponse({
      nextPath,
      requestUrl,
      supabase,
    });
  }
}

async function continueWithActiveAccount({
  nextPath,
  referralCode,
  requestUrl,
  supabase,
  userId,
}: {
  nextPath: string;
  referralCode: string;
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
    const signupCompleteUrl = new URL(requiredSignupProfileHref, requestUrl.origin);

    if (referralCode) {
      signupCompleteUrl.searchParams.set("ref", referralCode);
    }

    const response = NextResponse.redirect(
      signupCompleteUrl,
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
    {
      skipPhoneVerification:
        !shouldRequirePhoneVerificationBeforeContinue(nextPath),
    },
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

async function loadAccountStatus(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  userId: string,
): Promise<AccountStatus> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load account status: ${error.message}`);
  }

  if (!data) {
    throw new Error("Account profile is missing after bootstrap.");
  }

  return normalizeAccountStatus(data.account_status);
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

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
