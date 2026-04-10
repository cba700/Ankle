"use client";

import { useEffect, useState } from "react";
import { buildLoginHref } from "@/lib/auth/redirect";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

type WishlistResponse =
  | {
      matchIds?: string[];
      code?: string;
    }
  | null;

export function useMatchWishlist() {
  const [savedMatchIds, setSavedMatchIds] = useState<Record<string, boolean>>({});
  const [pendingMatchIds, setPendingMatchIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || !isSupabaseConfigured()) {
      setSavedMatchIds({});
      return;
    }

    const activeSupabase = supabase;
    let isMounted = true;

    async function syncWishlist() {
      try {
        const {
          data: { user },
        } = await activeSupabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setSavedMatchIds({});
          return;
        }

        const response = await fetch("/api/matches/wishlist", {
          method: "GET",
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setSavedMatchIds({});
          return;
        }

        const payload = (await response.json().catch(() => null)) as WishlistResponse;

        setSavedMatchIds(
          Object.fromEntries((payload?.matchIds ?? []).map((matchId) => [matchId, true])),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setSavedMatchIds({});
      }
    }

    void syncWishlist();

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange(() => {
      void syncWishlist();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function toggleMatchWishlist(matchId: string) {
    if (pendingMatchIds[matchId]) {
      return;
    }

    const nextPath = getCurrentPath();

    if (!isSupabaseConfigured()) {
      window.location.href = buildLoginHref(nextPath, "supabase_not_configured");
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      window.location.href = buildLoginHref(nextPath);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = buildLoginHref(nextPath);
      return;
    }

    const nextSaved = !(savedMatchIds[matchId] ?? false);

    setPendingMatchIds((current) => ({
      ...current,
      [matchId]: true,
    }));
    setSavedMatchIds((current) => ({
      ...current,
      [matchId]: nextSaved,
    }));

    try {
      const response = await fetch(`/api/matches/${matchId}/wishlist`, {
        method: nextSaved ? "POST" : "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as WishlistResponse;

      if (response.ok) {
        return nextSaved;
      }

      setSavedMatchIds((current) => ({
        ...current,
        [matchId]: !nextSaved,
      }));

      if (response.status === 401 || payload?.code === "AUTH_REQUIRED") {
        window.location.href = buildLoginHref(nextPath);
        return;
      }

      if (
        response.status === 503 ||
        payload?.code === "SUPABASE_NOT_CONFIGURED"
      ) {
        window.location.href = buildLoginHref(nextPath, "supabase_not_configured");
        return;
      }

      throw new Error(payload?.code ?? "WISHLIST_REQUEST_FAILED");
    } catch (error) {
      setSavedMatchIds((current) => ({
        ...current,
        [matchId]: !nextSaved,
      }));
      throw error;
    } finally {
      setPendingMatchIds((current) => {
        const next = { ...current };
        delete next[matchId];
        return next;
      });
    }
  }

  return {
    pendingMatchIds,
    savedMatchIds,
    toggleMatchWishlist,
  };
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}`;
}
