import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./server";

export type UserRole = "user" | "admin";

type ServerAuthState = {
  configured: boolean;
  role: UserRole;
  user: User | null;
};

type ServerUserState = {
  configured: boolean;
  user: User | null;
};

export async function getServerUserState(): Promise<ServerUserState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      user: null,
    };
  }

  return {
    configured: true,
    user,
  };
}

export async function getServerAuthState(): Promise<ServerAuthState> {
  const { configured, user } = await getServerUserState();

  if (!configured || !user) {
    return {
      configured,
      role: "user",
      user,
    };
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      role: "user",
      user: null,
    };
  }

  let role = normalizeUserRole(
    user.app_metadata?.role ?? user.user_metadata?.role,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role) {
    role = normalizeUserRole(profile.role);
  }

  return {
    configured: true,
    role,
    user,
  };
}

function normalizeUserRole(role: unknown): UserRole {
  return role === "admin" ? "admin" : "user";
}
