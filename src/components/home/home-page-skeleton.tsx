import styles from "./home-page-skeleton.module.css";

export function HomePageSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.brand}>앵클</div>
          <div className={styles.headerTabs}>
            <div className={styles.tab} />
            <div className={styles.tab} />
          </div>
        </div>
        <div className={styles.hero} />
        <div className={styles.filters}>
          <div className={styles.filterChip} />
          <div className={styles.filterChip} />
          <div className={styles.filterChip} />
        </div>
        <div className={styles.heading} />
        <div className={styles.cards}>
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </div>
    </div>
  );
}
