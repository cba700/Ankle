import { Suspense } from "react";
import { SearchIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import styles from "./match-detail-header.module.css";

export function MatchDetailHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <AppLink className={styles.brand} href="/">
          <span className={styles.brandWord}>앵클</span>
          <span className={styles.brandDot}>.</span>
        </AppLink>

        <div className={styles.actions}>
          <Suspense fallback={<MatchSearchFallback />}>
            <MatchSearch />
          </Suspense>
          <UserHeaderMenu currentSection="match" />
        </div>
      </div>
    </header>
  );
}

function MatchSearchFallback() {
  return (
    <div aria-hidden="true" className={styles.search}>
      <SearchIcon className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        placeholder="지역, 코트, 매치 이름으로 찾기"
        readOnly
        tabIndex={-1}
        value=""
      />
    </div>
  );
}
