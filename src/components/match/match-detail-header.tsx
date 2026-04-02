import Link from "next/link";
import { CalendarIcon, SearchIcon, UserIcon } from "@/components/icons";
import styles from "./match-detail-header.module.css";

export function MatchDetailHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandWord}>앵클</span>
          <span className={styles.brandDot}>.</span>
        </Link>

        <div className={styles.actions}>
          <label className={styles.search}>
            <SearchIcon className={styles.searchIcon} />
            <span className="visuallyHidden">검색</span>
            <input
              className={styles.searchInput}
              placeholder="지역, 코트, 팀 이름으로 찾기"
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
    </header>
  );
}

