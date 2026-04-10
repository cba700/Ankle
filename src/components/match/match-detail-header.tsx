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
          <MatchSearch />
          <UserHeaderMenu currentSection="match" />
        </div>
      </div>
    </header>
  );
}
