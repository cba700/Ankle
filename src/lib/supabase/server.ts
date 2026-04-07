import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicEnv, getSupabaseServiceEnv } from "./env";

let publicServerClient:
  | ReturnType<typeof createClient>
  | null
  | undefined;
let serviceRoleClient:
  | ReturnType<typeof createClient>
  | null
  | undefined;

export async function getSupabaseServerClient() {
  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can't always write cookies.
          }
        },
      },
    },
  );
}

export function getSupabasePublicServerClient() {
  if (publicServerClient !== undefined) {
    return publicServerClient;
  }

  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    publicServerClient = null;
    return publicServerClient;
  }

  publicServerClient = createClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return publicServerClient;
}

export function getSupabaseServiceRoleClient() {
  if (serviceRoleClient !== undefined) {
    return serviceRoleClient;
  }

  const supabaseEnv = getSupabaseServiceEnv();

  if (!supabaseEnv) {
    serviceRoleClient = null;
    return serviceRoleClient;
  }

  serviceRoleClient = createClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return serviceRoleClient;
}
