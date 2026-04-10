"use client";

import { useEffect, useState } from "react";
import { UserIcon } from "@/components/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AppLink } from "./app-link";
import styles from "./user-header-menu.module.css";

type UserHeaderMenuProps = {
  currentSection: "match" | "mypage";
  initialIsAdmin?: boolean;
  initialSignedIn?: boolean;
};

type MenuState = {
  isAdmin: boolean;
  isSignedIn: boolean;
};

export function UserHeaderMenu({
  currentSection,
  initialIsAdmin = false,
  initialSignedIn = false,
}: UserHeaderMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>({
    isAdmin: initialIsAdmin,
    isSignedIn: initialSignedIn,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMenuState({
        isAdmin: initialIsAdmin,
        isSignedIn: initialSignedIn,
      });
      return;
    }

    const activeSupabase = supabase;
    let isMounted = true;

    async function syncMenuState() {
      try {
        const {
          data: { user },
        } = await activeSupabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setMenuState({
            isAdmin: false,
            isSignedIn: false,
          });
          return;
        }

        const { data: profile } = await activeSupabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        setMenuState({
          isAdmin: profile?.role === "admin",
          isSignedIn: true,
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setMenuState({
          isAdmin: initialIsAdmin,
          isSignedIn: initialSignedIn,
        });
      }
    }

    void syncMenuState();

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange(() => {
      void syncMenuState();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initialIsAdmin, initialSignedIn]);

  return (
    <nav className={styles.menu}>
      <AppLink
        aria-current={currentSection === "match" ? "page" : undefined}
        className={`${styles.link} ${
          currentSection === "match" ? styles.linkActive : ""
        }`}
        href="/"
      >
        매치
      </AppLink>
      {menuState.isAdmin ? (
        <AppLink className={styles.link} href="/admin">
          관리자
        </AppLink>
      ) : null}
      <AppLink
        aria-label={menuState.isSignedIn ? "마이페이지" : "로그인"}
        aria-current={currentSection === "mypage" ? "page" : undefined}
        className={`${styles.iconLink} ${
          currentSection === "mypage" ? styles.linkActive : ""
        }`}
        href={menuState.isSignedIn ? "/mypage" : "/login"}
      >
        <UserIcon className={styles.userIcon} />
        <span className="visuallyHidden">
          {menuState.isSignedIn ? "마이페이지" : "로그인"}
        </span>
      </AppLink>
    </nav>
  );
}
