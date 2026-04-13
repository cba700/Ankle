import "server-only";

import type {
  PreferredTimeSlot,
  PreferredWeekday,
  TemporaryLevel,
} from "@/lib/player-preferences";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

type ProfileOnboardingRow = {
  onboarding_completed_at: string | null;
  onboarding_required: boolean | null;
  preferred_time_slots: string[] | null;
  preferred_weekdays: string[] | null;
  temporary_level: string | null;
};

export type ProfileOnboardingState = {
  onboardingCompletedAt: string | null;
  onboardingRequired: boolean;
  preferredTimeSlots: PreferredTimeSlot[];
  preferredWeekdays: PreferredWeekday[];
  temporaryLevel: TemporaryLevel | null;
};

const PROFILE_ONBOARDING_SELECT = `
  onboarding_required,
  onboarding_completed_at,
  temporary_level,
  preferred_weekdays,
  preferred_time_slots
`;

export async function getProfileOnboardingState(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<ProfileOnboardingState> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_ONBOARDING_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile onboarding state: ${error.message}`);
  }

  const row = data as ProfileOnboardingRow | null;

  return {
    onboardingCompletedAt: row?.onboarding_completed_at ?? null,
    onboardingRequired: row?.onboarding_required ?? false,
    preferredTimeSlots: ((row?.preferred_time_slots ?? []) as PreferredTimeSlot[]),
    preferredWeekdays: ((row?.preferred_weekdays ?? []) as PreferredWeekday[]),
    temporaryLevel: (row?.temporary_level as TemporaryLevel | null) ?? null,
  };
}

export async function updateProfileOnboardingPreferences({
  completeOnboarding = false,
  preferredTimeSlots,
  preferredWeekdays,
  supabase,
  temporaryLevel,
  userId,
}: {
  completeOnboarding?: boolean;
  preferredTimeSlots: readonly PreferredTimeSlot[];
  preferredWeekdays: readonly PreferredWeekday[];
  supabase: SupabaseServerClient;
  temporaryLevel: TemporaryLevel;
  userId: string;
}) {
  const updates: {
    onboarding_completed_at?: string;
    onboarding_required?: boolean;
    preferred_time_slots: readonly PreferredTimeSlot[];
    preferred_weekdays: readonly PreferredWeekday[];
    temporary_level: TemporaryLevel;
  } = {
    preferred_time_slots: preferredTimeSlots,
    preferred_weekdays: preferredWeekdays,
    temporary_level: temporaryLevel,
  };

  if (completeOnboarding) {
    updates.onboarding_completed_at = new Date().toISOString();
    updates.onboarding_required = false;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update profile preferences: ${error.message}`);
  }
}
