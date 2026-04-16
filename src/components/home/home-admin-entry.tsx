"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/navigation/app-link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./home-header.module.css";

type HomeAdminEntryProps = {
  initialIsAdmin: boolean;
};

export function HomeAdminEntry({ initialIsAdmin }: HomeAdminEntryProps) {
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setIsAdmin(initialIsAdmin);
      return;
    }

    const activeSupabase = supabase;
    let isMounted = true;

    async function syncAdminState() {
      try {
        const {
          data: { user },
        } = await activeSupabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile, error } = await activeSupabase
          .from("profiles")
          .select("role, account_status")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (error) {
          setIsAdmin(false);
          return;
        }

        setIsAdmin(
          profile?.account_status === "active" &&
            normalizeUserRole(profile?.role) === "admin",
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setIsAdmin(false);
      }
    }

    void syncAdminState();

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange(() => {
      void syncAdminState();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialIsAdmin]);

  if (!isAdmin) {
    return null;
  }

  return (
    <AppLink className={styles.adminButton} href="/admin">
      관리자
    </AppLink>
  );
}

function normalizeUserRole(role: unknown) {
  return role === "admin" ? "admin" : "user";
}
