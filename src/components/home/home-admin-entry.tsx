"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

        let role = normalizeUserRole(
          user.app_metadata?.role ?? user.user_metadata?.role,
        );

        const { data: profile } = await activeSupabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (profile?.role) {
          role = normalizeUserRole(profile.role);
        }

        setIsAdmin(role === "admin");
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
    <Link className={styles.adminButton} href="/admin">
      관리자
    </Link>
  );
}

function normalizeUserRole(role: unknown) {
  return role === "admin" ? "admin" : "user";
}
