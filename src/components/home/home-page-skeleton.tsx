import { AppHeaderSkeleton } from "@/components/skeleton/app-header-skeleton";
import { SkeletonBlock } from "@/components/skeleton/skeleton";
import styles from "./home-page-skeleton.module.css";

type HomePageSkeletonProps = {
  branded?: boolean;
};

const MATCH_ROW_COUNT = 5;
const QUICK_MENU_COUNT = 5;
const DATE_CHIP_COUNT = 6;
const FILTER_CHIP_WIDTHS = [92, 78, 70, 74, 108];

export function HomePageSkeleton({
  branded = false,
}: HomePageSkeletonProps) {
  if (branded) {
    return (
      <div className={`${styles.page} ${styles.pageBrandOnly}`}>
        <div className={styles.wordmark}>앵클</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.frame}>
          <AppHeaderSkeleton variant="home" />

          <main className={styles.main}>
            <section className={styles.hero}>
              <div className={styles.heroGlow} />
              <div className={styles.heroBody}>
                <div className={styles.heroCopy}>
                  <SkeletonBlock className={styles.eyebrow} tone="strong" />
                  <SkeletonBlock className={styles.heroTitlePrimary} tone="strong" />
                  <SkeletonBlock className={styles.heroTitleSecondary} tone="strong" />
                  <SkeletonBlock className={styles.heroDescription} />
                </div>

                <div className={styles.heroBadge}>
                  <SkeletonBlock className={styles.heroBadgeValue} tone="strong" />
                  <SkeletonBlock className={styles.heroBadgeLabel} />
                </div>
              </div>
            </section>

            <section className={styles.quickMenuSection}>
              <div className={styles.quickMenuRow}>
                {Array.from({ length: QUICK_MENU_COUNT }, (_, index) => (
                  <article className={styles.quickMenuItem} key={`quick-${index}`}>
                    <SkeletonBlock className={styles.quickMenuIcon} />
                    <SkeletonBlock className={styles.quickMenuLabel} />
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.noticeBar}>
              <SkeletonBlock className={styles.noticeIcon} />
              <SkeletonBlock className={styles.noticeCopy} />
              <SkeletonBlock className={styles.noticeArrow} />
            </section>

            <section className={styles.browserPanel}>
              <section className={styles.datePicker}>
                <SkeletonBlock className={styles.dateArrow} />
                <div className={styles.dateChipList}>
                  {Array.from({ length: DATE_CHIP_COUNT }, (_, index) => (
                    <SkeletonBlock
                      className={`${styles.dateChip} ${
                        index === 1 ? styles.dateChipActive : ""
                      }`}
                      key={`date-${index}`}
                    />
                  ))}
                </div>
                <SkeletonBlock className={styles.dateArrow} />
              </section>

              <section className={styles.dateSummary}>
                <SkeletonBlock className={styles.dateSummaryEyebrow} tone="strong" />
                <SkeletonBlock className={styles.dateSummaryTitle} tone="strong" />
              </section>

              <section className={styles.filterBar}>
                {FILTER_CHIP_WIDTHS.map((width, index) => (
                  <SkeletonBlock
                    className={styles.filterChip}
                    key={`filter-${index}`}
                    style={{ width }}
                  />
                ))}
              </section>

              <section className={styles.list}>
                {Array.from({ length: MATCH_ROW_COUNT }, (_, index) => (
                  <article className={styles.row} key={`row-${index}`}>
                    <div className={styles.rowLink}>
                      <div className={styles.timeColumn}>
                        <SkeletonBlock className={styles.time} tone="strong" />
                        <SkeletonBlock className={styles.status} />
                      </div>

                      <div className={styles.infoColumn}>
                        <div className={styles.badgeRow}>
                          <SkeletonBlock className={styles.infoBadge} />
                          <SkeletonBlock className={styles.infoBadgeShort} />
                        </div>
                        <SkeletonBlock className={styles.venue} tone="strong" />
                        <SkeletonBlock className={styles.title} />
                        <div className={styles.metaRow}>
                          <SkeletonBlock className={styles.meta} />
                          <SkeletonBlock className={styles.metaShort} />
                          <SkeletonBlock className={styles.meta} />
                        </div>
                      </div>
                    </div>

                    <SkeletonBlock className={styles.likeButton} />
                  </article>
                ))}
              </section>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
