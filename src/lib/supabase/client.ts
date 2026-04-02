"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, isSupabaseConfigured as isConfigured } from "./env";

let browserClient: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const supabaseEnv = getSupabasePublicEnv();

  if (!supabaseEnv) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createBrowserClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
  );

  return browserClient;
}

export function isSupabaseConfigured() {
  return isConfigured();
}
