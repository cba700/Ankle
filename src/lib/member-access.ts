import "server-only";

import { buildVerifyPhoneHref, buildWelcomeHref } from "@/lib/auth/redirect";
import {
  getProfileOnboardingState,
  type ProfileOnboardingState,
} from "@/lib/profile-onboarding";
import { assertProfileOnboardingSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

export async function getMemberSetupState(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProfileOnboardingState> {
  await assertProfileOnboardingSchemaReady(supabase);
  return getProfileOnboardingState(supabase, userId);
}

export function getRequiredMemberSetupHref(
  setupState: ProfileOnboardingState,
  nextPath?: string | null,
  options?: {
    skipPhoneVerification?: boolean;
  },
) {
  if (setupState.phoneVerificationRequired && !options?.skipPhoneVerification) {
    return buildVerifyPhoneHref(nextPath);
  }

  if (setupState.onboardingRequired) {
    return buildWelcomeHref(nextPath);
  }

  return null;
}

export async function getRequiredMemberSetupRedirectPath(
  supabase: SupabaseServerClient,
  userId: string,
  nextPath?: string | null,
  options?: {
    skipPhoneVerification?: boolean;
  },
) {
  const setupState = await getMemberSetupState(supabase, userId);
  return getRequiredMemberSetupHref(setupState, nextPath, options);
}
