import { AppHeaderSkeleton } from "@/components/skeleton/app-header-skeleton";
import { SkeletonBlock } from "@/components/skeleton/skeleton";
import styles from "./match-detail-skeleton.module.css";

const DETAIL_SECTION_COUNT = 4;
const INFO_CARD_COUNT = 4;
const FACILITY_COUNT = 6;

export function MatchDetailSkeleton() {
  return (
    <div className={styles.page}>
      <AppHeaderSkeleton variant="detail" />

      <section className={styles.hero}>
        <div className={styles.heroFrame}>
          <SkeletonBlock className={styles.heroImage} tone="strong" />
          <SkeletonBlock className={styles.shareButton} />

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
          <section className={styles.leadCard}>
            <SkeletonBlock className={styles.status} />
            <SkeletonBlock className={styles.titlePrimary} tone="strong" />
            <SkeletonBlock className={styles.titleSecondary} tone="strong" />
            <SkeletonBlock className={styles.subTitle} />
            <div className={styles.quickMeta}>
              <SkeletonBlock className={styles.metaPill} />
              <SkeletonBlock className={styles.metaPillWide} />
            </div>
          </section>

          <section className={styles.sectionCard}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <div className={styles.infoGrid}>
              {Array.from({ length: INFO_CARD_COUNT }, (_, index) => (
                <article className={styles.infoCard} key={`info-${index}`}>
                  <SkeletonBlock className={styles.infoIcon} />
                  <div className={styles.infoCopy}>
                    <SkeletonBlock className={styles.infoLabel} />
                    <SkeletonBlock className={styles.infoValue} tone="strong" />
                  </div>
                </article>
              ))}
            </div>
            <SkeletonBlock className={styles.viewerPill} tone="strong" />
          </section>

          <section className={styles.sectionCard}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <SkeletonBlock className={styles.sectionLineLong} />
            <div className={styles.barGrid}>
              <SkeletonBlock className={styles.bar} tone="strong" />
              <SkeletonBlock className={styles.barTall} tone="strong" />
              <SkeletonBlock className={styles.barShort} tone="strong" />
            </div>
            <SkeletonBlock className={styles.hintBox} />
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
            <div className={styles.statsRow}>
              <SkeletonBlock className={styles.stat} />
              <SkeletonBlock className={styles.stat} />
            </div>
            <SkeletonBlock className={styles.noticeBox} />
            <SkeletonBlock className={styles.price} tone="strong" />
            <SkeletonBlock className={styles.faqButton} />
            <SkeletonBlock className={styles.noticeButton} />
            <div className={styles.ctaRow}>
              <SkeletonBlock className={styles.saveButton} />
              <SkeletonBlock className={styles.ctaButton} tone="strong" />
              <SkeletonBlock className={styles.ctaButton} tone="strong" />
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
