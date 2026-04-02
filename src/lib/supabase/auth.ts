import "server-only";

import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "./server";

export type UserRole = "user" | "admin";

type ServerAuthState = {
  configured: boolean;
  role: UserRole;
  user: User | null;
};

export async function getServerAuthState(): Promise<ServerAuthState> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      role: "user",
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
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
