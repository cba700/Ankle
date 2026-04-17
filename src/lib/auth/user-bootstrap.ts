import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  assertCashFoundationSchemaReady,
  assertCouponSchemaReady,
  assertSignupProfileSchemaReady,
} from "@/lib/supabase/schema";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/server";

type AuthBootstrapProfileRow = {
  account_status: string | null;
  avatar_url: string | null;
  created_at: string;
  display_name: string | null;
  id: string;
  role: string | null;
  updated_at: string;
};

type AuthBootstrapResult = {
  cashAccountCreated: boolean;
  profile: AuthBootstrapProfileRow;
  profileCreated: boolean;
};

type AuthBootstrapUser = Pick<User, "id" | "user_metadata">;

export async function ensureAuthUserBootstrap(
  user: AuthBootstrapUser,
  adminClient?: ReturnType<typeof getSupabaseServiceRoleClient>,
): Promise<AuthBootstrapResult> {
  const admin = adminClient ?? getSupabaseServiceRoleClient();

  if (!admin) {
    throw new Error("Service role client is not configured.");
  }

  await assertSignupProfileSchemaReady(admin as any);
  await assertCashFoundationSchemaReady(admin as any);
  await assertCouponSchemaReady(admin as any);

  let profile = await loadBootstrapProfile(admin, user.id);
  let profileCreated = false;

  if (!profile) {
    const { error: insertProfileError } = await (admin.from("profiles") as any).insert({
      avatar_url: readBootstrapString(user.user_metadata?.avatar_url),
      display_name:
        readBootstrapString(user.user_metadata?.name) ??
        readBootstrapString(user.user_metadata?.full_name),
      id: user.id,
      onboarding_required: true,
      phone_verification_required: true,
      signup_profile_required: true,
    });

    if (insertProfileError && insertProfileError.code !== "23505") {
      throw new Error(`Failed to create bootstrap profile: ${insertProfileError.message}`);
    }

    profile = await loadBootstrapProfile(admin, user.id);

    if (!profile) {
      throw new Error("Bootstrap profile row is still missing after insert.");
    }

    profileCreated = true;
    console.warn("[auth-bootstrap] Recreated missing profile row", {
      userId: user.id,
    });
  } else {
    const profileUpdates: Record<string, string> = {};
    const fallbackDisplayName =
      readBootstrapString(user.user_metadata?.name) ??
      readBootstrapString(user.user_metadata?.full_name);
    const fallbackAvatarUrl = readBootstrapString(user.user_metadata?.avatar_url);

    if (!readBootstrapString(profile.display_name) && fallbackDisplayName) {
      profileUpdates.display_name = fallbackDisplayName;
    }

    if (!readBootstrapString(profile.avatar_url) && fallbackAvatarUrl) {
      profileUpdates.avatar_url = fallbackAvatarUrl;
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateProfileError } = await (admin.from("profiles") as any)
        .update(profileUpdates)
        .eq("id", user.id);

      if (updateProfileError) {
        throw new Error(
          `Failed to update bootstrap profile defaults: ${updateProfileError.message}`,
        );
      }

      profile = await loadBootstrapProfile(admin, user.id);

      if (!profile) {
        throw new Error("Bootstrap profile row disappeared after update.");
      }
    }
  }

  const { data: cashAccount, error: cashAccountError } = await (admin
    .from("cash_accounts") as any)
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cashAccountError) {
    throw new Error(`Failed to load cash account: ${cashAccountError.message}`);
  }

  let cashAccountCreated = false;

  if (!cashAccount) {
    const { error: insertCashAccountError } = await (admin.from("cash_accounts") as any)
      .insert({
        user_id: user.id,
      });

    if (insertCashAccountError && insertCashAccountError.code !== "23505") {
      throw new Error(`Failed to create cash account: ${insertCashAccountError.message}`);
    }

    cashAccountCreated = true;
    console.warn("[auth-bootstrap] Recreated missing cash account", {
      userId: user.id,
    });
  }

  if (profileCreated) {
    const { error: issueCouponError } = await (admin as any).rpc(
      "issue_signup_welcome_coupons",
      {
        p_user_id: user.id,
      },
    );

    if (issueCouponError) {
      throw new Error(`Failed to issue signup welcome coupons: ${issueCouponError.message}`);
    }
  }

  return {
    cashAccountCreated,
    profile,
    profileCreated,
  };
}

async function loadBootstrapProfile(
  admin: NonNullable<ReturnType<typeof getSupabaseServiceRoleClient>>,
  userId: string,
) {
  const { data, error } = await (admin.from("profiles") as any)
    .select("id, role, account_status, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load bootstrap profile: ${error.message}`);
  }

  return (data ?? null) as AuthBootstrapProfileRow | null;
}

function readBootstrapString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}
