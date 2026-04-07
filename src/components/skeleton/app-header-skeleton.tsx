import { SkeletonBlock } from "./skeleton";
import styles from "./app-header-skeleton.module.css";

type AppHeaderSkeletonProps = {
  variant: "home" | "detail" | "mypage";
};

export function AppHeaderSkeleton({ variant }: AppHeaderSkeletonProps) {
  return (
    <header className={styles.header}>
      <div
        className={`${styles.inner} ${
          variant === "mypage" ? styles.innerMypage : ""
        }`}
      >
        <SkeletonBlock className={styles.brand} tone="strong" />

        <div className={styles.actions}>
          <div className={styles.menu}>
            <SkeletonBlock className={styles.menuItem} />
            {variant === "mypage" ? (
              <SkeletonBlock className={styles.menuItemWide} />
            ) : null}
            <SkeletonBlock className={styles.menuItem} />
          </div>
          <SkeletonBlock className={styles.search} />
        </div>
      </div>
    </header>
  );
}
