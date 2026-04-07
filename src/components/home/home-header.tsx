import { CalendarIcon, SearchIcon, UserIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
import { HomeAdminEntry } from "./home-admin-entry";
import styles from "./home-header.module.css";

type HomeHeaderProps = {
  isAdmin: boolean;
  myPageHref: string;
  tabLabel: string;
};

export function HomeHeader({ isAdmin, myPageHref, tabLabel }: HomeHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <AppLink className={styles.brand} href="/">
            <span className={styles.brandWord}>앵클</span>
            <span className={styles.brandDot}>.</span>
          </AppLink>

          <div className={styles.headerActions}>
            <label className={styles.search}>
              <SearchIcon className={styles.searchIcon} />
              <span className="visuallyHidden">검색</span>
              <input
                className={styles.searchInput}
                placeholder="지역, 코트 이름으로 찾기"
                type="text"
              />
            </label>
            <HomeAdminEntry initialIsAdmin={isAdmin} />
            <button aria-label="일정" className={styles.iconButton} type="button">
              <CalendarIcon className={styles.actionIcon} />
            </button>
            <AppLink aria-label="마이페이지" className={styles.iconButton} href={myPageHref}>
              <UserIcon className={styles.actionIcon} />
            </AppLink>
          </div>
        </div>

        <nav className={styles.nav}>
          <button className={styles.activeTab} type="button">
            {tabLabel}
            <span className={styles.activeLine} />
          </button>
        </nav>
      </div>
    </header>
  );
}
