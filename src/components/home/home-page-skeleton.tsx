import styles from "./home-page-skeleton.module.css";

export function HomePageSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.wordmark}>앵클</div>
    </div>
  );
}
