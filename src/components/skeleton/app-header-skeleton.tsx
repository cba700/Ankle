import { SkeletonBlock } from "./skeleton";
import styles from "./app-header-skeleton.module.css";

type AppHeaderSkeletonProps = {
  variant: "home" | "detail" | "mypage";
};

export function AppHeaderSkeleton({ variant }: AppHeaderSkeletonProps) {
  if (variant === "home") {
    return (
      <header className={`${styles.header} ${styles.homeHeader}`}>
        <div className={styles.homeFrame}>
          <div className={styles.homeTopRow}>
            <SkeletonBlock className={styles.brand} tone="strong" />

            <div className={styles.actions}>
              <SkeletonBlock className={styles.search} />
              <SkeletonBlock className={styles.iconButton} />
              <SkeletonBlock className={styles.iconButton} />
            </div>
          </div>

          <div className={styles.homeNav}>
            <SkeletonBlock className={styles.tab} tone="strong" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`${styles.header} ${styles.pageHeader}`}>
      <div
        className={`${styles.pageInner} ${
          variant === "mypage" ? styles.pageInnerNarrow : ""
        }`}
      >
        <SkeletonBlock className={styles.brand} tone="strong" />

        <div className={styles.actions}>
          <SkeletonBlock className={styles.search} />
          <SkeletonBlock className={styles.iconButton} />
          <SkeletonBlock className={styles.iconButton} />
        </div>
      </div>
    </header>
  );
}
