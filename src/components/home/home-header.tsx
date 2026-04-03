import Link from "next/link";
import { CalendarIcon, SearchIcon, UserIcon } from "@/components/icons";
import styles from "./home-header.module.css";

type HomeHeaderProps = {
  isAdmin: boolean;
  tabLabel: string;
};

export function HomeHeader({ isAdmin, tabLabel }: HomeHeaderProps) {
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
          {isAdmin ? (
            <Link className={styles.adminButton} href="/admin">
              관리자
            </Link>
          ) : null}
          <button aria-label="일정" className={styles.iconButton} type="button">
            <CalendarIcon className={styles.actionIcon} />
          </button>
          <Link aria-label="로그인" className={styles.iconButton} href="/login">
            <UserIcon className={styles.actionIcon} />
          </Link>
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
