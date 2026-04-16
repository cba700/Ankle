import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  normalizeAccountStatus,
  type AccountStatus,
} from "@/lib/account-withdrawal";
import { getSupabaseServerClient } from "./server";

export type UserRole = "user" | "admin";

type ServerAuthState = {
  accountStatus: AccountStatus;
  configured: boolean;
  role: UserRole;
  user: User | null;
  withdrawnAt: string | null;
  withdrawalRequestedAt: string | null;
};

type ServerUserState = {
  accountStatus: AccountStatus;
  configured: boolean;
  role: UserRole;
  user: User | null;
  withdrawnAt: string | null;
  withdrawalRequestedAt: string | null;
};

export async function getServerUserState(): Promise<ServerUserState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      accountStatus: "active",
      configured: false,
      role: "user",
      user: null,
      withdrawnAt: null,
      withdrawalRequestedAt: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      accountStatus: "active",
      configured: true,
      role: "user",
      user: null,
      withdrawnAt: null,
      withdrawalRequestedAt: null,
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, account_status, withdrawal_requested_at, withdrawn_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      accountStatus: "active",
      configured: true,
      role: "user",
      user,
      withdrawnAt: null,
      withdrawalRequestedAt: null,
    };
  }

  return {
    accountStatus: normalizeAccountStatus(profile?.account_status),
    configured: true,
    role: normalizeUserRole(profile?.role),
    user,
    withdrawnAt:
      typeof profile?.withdrawn_at === "string" ? profile.withdrawn_at : null,
    withdrawalRequestedAt:
      typeof profile?.withdrawal_requested_at === "string"
        ? profile.withdrawal_requested_at
        : null,
  };
}

export async function getServerAuthState(): Promise<ServerAuthState> {
  const {
    accountStatus,
    configured,
    role,
    user,
    withdrawnAt,
    withdrawalRequestedAt,
  } = await getServerUserState();

  return {
    accountStatus,
    configured,
    role,
    user,
    withdrawnAt,
    withdrawalRequestedAt,
  };
}

function normalizeUserRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user";
}
