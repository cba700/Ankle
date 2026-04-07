import { SearchIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
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
          <UserHeaderMenu currentSection="match" initialIsAdmin={isAdmin} />
          <label className={styles.search}>
            <SearchIcon className={styles.searchIcon} />
            <span className="visuallyHidden">검색</span>
            <input
              className={styles.searchInput}
              placeholder="지역, 코트 이름으로 찾기"
              type="text"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
