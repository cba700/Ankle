"use client";

import type { MouseEvent } from "react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import { HOME_RESET_TO_TODAY_EVENT } from "./home-route-state";
import styles from "./home-header.module.css";

type HomeHeaderProps = {
  isAdmin: boolean;
  resetBrandOnClick?: boolean;
};

export function HomeHeader({ isAdmin, resetBrandOnClick = true }: HomeHeaderProps) {
  function handleBrandClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!resetBrandOnClick) {
      return;
    }

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    window.dispatchEvent(new Event(HOME_RESET_TO_TODAY_EVENT));
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <AppLink className={styles.brand} href="/" onClick={handleBrandClick}>
          <BrandLogo className={styles.brandLogo} priority />
        </AppLink>

        <div className={styles.headerActions}>
          <MatchSearch />
          <UserHeaderMenu
            currentSection="match"
            initialIsAdmin={isAdmin}
            layout="icon-only"
          />
        </div>
      </div>
    </header>
  );
}
