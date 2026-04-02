import { CalendarIcon, SearchIcon, UserIcon } from "@/components/icons";
import styles from "./home-header.module.css";

type HomeHeaderProps = {
  tabLabel: string;
};

export function HomeHeader({ tabLabel }: HomeHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <div className={styles.brand}>
          <span className={styles.brandWord}>앵클</span>
          <span className={styles.brandDot}>.</span>
        </div>

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
          <button aria-label="일정" className={styles.iconButton} type="button">
            <CalendarIcon className={styles.actionIcon} />
          </button>
          <button aria-label="프로필" className={styles.iconButton} type="button">
            <UserIcon className={styles.actionIcon} />
          </button>
        </div>
      </div>

      <nav className={styles.nav}>
        <button className={styles.activeTab} type="button">
          {tabLabel}
          <span className={styles.activeLine} />
        </button>
      </nav>
    </header>
  );
}

