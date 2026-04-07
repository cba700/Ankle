import { SearchIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
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
          <UserHeaderMenu currentSection="match" />
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
