import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";

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
