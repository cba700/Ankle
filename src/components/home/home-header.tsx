import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import styles from "./home-header.module.css";

type HomeHeaderProps = {
  isAdmin: boolean;
};

export function HomeHeader({ isAdmin }: HomeHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <AppLink className={styles.brand} href="/">
          <span className={styles.brandWord}>앵클</span>
          <span className={styles.brandDot}>.</span>
        </AppLink>

        <div className={styles.headerActions}>
          <MatchSearch />
          <UserHeaderMenu currentSection="match" initialIsAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
