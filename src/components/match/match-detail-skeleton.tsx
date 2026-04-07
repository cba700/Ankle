import { AppHeaderSkeleton } from "@/components/skeleton/app-header-skeleton";
import { SkeletonBlock } from "@/components/skeleton/skeleton";
import styles from "./match-detail-skeleton.module.css";

const INFO_ITEM_COUNT = 6;
const FACILITY_COUNT = 6;
const DETAIL_SECTION_COUNT = 3;

export function MatchDetailSkeleton() {
  return (
    <div className={styles.page}>
      <AppHeaderSkeleton variant="detail" />

      <section className={styles.hero}>
        <div className={styles.heroFrame}>
          <SkeletonBlock className={styles.heroImage} tone="strong" />
          <SkeletonBlock className={styles.shareButton} />
          <div className={styles.heroCopy}>
            <SkeletonBlock className={styles.status} />
            <SkeletonBlock className={styles.titlePrimary} tone="strong" />
            <SkeletonBlock className={styles.titleSecondary} tone="strong" />
            <SkeletonBlock className={styles.subTitle} />
          </div>
          <div className={styles.bottomBar}>
            <SkeletonBlock className={styles.counter} />
            <div className={styles.controls}>
              <SkeletonBlock className={styles.control} />
              <SkeletonBlock className={styles.control} />
            </div>
          </div>
        </div>
      </section>

      <main className={styles.body}>
        <div className={styles.contentColumn}>
          <section className={styles.sectionCard}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <div className={styles.infoGrid}>
              {Array.from({ length: INFO_ITEM_COUNT }, (_, index) => (
                <div className={styles.infoItem} key={`info-${index}`}>
                  <SkeletonBlock className={styles.infoLabel} />
                  <SkeletonBlock className={styles.infoValue} tone="strong" />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <div className={styles.barGrid}>
              <SkeletonBlock className={styles.bar} tone="strong" />
              <SkeletonBlock className={styles.barTall} tone="strong" />
              <SkeletonBlock className={styles.barShort} tone="strong" />
            </div>
            <SkeletonBlock className={styles.sectionLineLong} />
          </section>

          <section className={styles.sectionCard}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <div className={styles.facilityGrid}>
              {Array.from({ length: FACILITY_COUNT }, (_, index) => (
                <SkeletonBlock className={styles.facilityItem} key={`facility-${index}`} />
              ))}
            </div>
            <SkeletonBlock className={styles.sectionSubTitle} tone="strong" />
            <div className={styles.noteList}>
              <SkeletonBlock className={styles.noteLine} />
              <SkeletonBlock className={styles.noteLineLong} />
              <SkeletonBlock className={styles.noteLine} />
            </div>
          </section>

          {Array.from({ length: DETAIL_SECTION_COUNT }, (_, index) => (
            <section className={styles.sectionCard} key={`section-${index}`}>
              <SkeletonBlock className={styles.sectionTitle} tone="strong" />
              <div className={styles.bulletList}>
                <SkeletonBlock className={styles.bulletLineLong} />
                <SkeletonBlock className={styles.bulletLine} />
                <SkeletonBlock className={styles.bulletLineLong} />
              </div>
            </section>
          ))}
        </div>

        <aside className={styles.sidebarColumn}>
          <section className={styles.sidebarCard}>
            <SkeletonBlock className={styles.sidebarMeta} />
            <SkeletonBlock className={styles.sidebarTitle} tone="strong" />
            <SkeletonBlock className={styles.sidebarAddress} />
            <div className={styles.linkRow}>
              <SkeletonBlock className={styles.linkButton} />
              <SkeletonBlock className={styles.linkButton} />
            </div>
            <SkeletonBlock className={styles.price} tone="strong" />
            <div className={styles.ctaRow}>
              <SkeletonBlock className={styles.ctaButton} tone="strong" />
              <SkeletonBlock className={styles.saveButton} />
            </div>
          </section>
        </aside>
      </main>

      <div className={styles.mobileBar}>
        <div className={styles.mobileBarInner}>
          <SkeletonBlock className={styles.mobilePrice} tone="strong" />
          <SkeletonBlock className={styles.mobileButton} tone="strong" />
        </div>
      </div>
    </div>
  );
}
