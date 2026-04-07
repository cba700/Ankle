import { AppHeaderSkeleton } from "@/components/skeleton/app-header-skeleton";
import { SkeletonBlock } from "@/components/skeleton/skeleton";
import styles from "./my-page-skeleton.module.css";

const MENU_ROW_COUNT = 5;
const SUPPORT_ROW_COUNT = 2;
const APPLICATION_COUNT = 3;

export function MyPageSkeleton() {
  return (
    <div className={styles.page}>
      <AppHeaderSkeleton variant="mypage" />

      <main className={styles.main}>
        <section className={styles.leftColumn}>
          <article className={styles.profileCard}>
            <div className={styles.profileTop}>
              <div className={styles.profileIdentity}>
                <SkeletonBlock className={styles.avatar} />
                <div className={styles.profileCopy}>
                  <SkeletonBlock className={styles.profileName} tone="strong" />
                  <SkeletonBlock className={styles.profileEmail} />
                </div>
              </div>

              <div className={styles.profileActions}>
                <SkeletonBlock className={styles.secondaryButton} />
                <SkeletonBlock className={styles.iconAction} />
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statBox}>
                <SkeletonBlock className={styles.statLabel} />
                <SkeletonBlock className={styles.statValue} tone="strong" />
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <SkeletonBlock className={styles.statLabel} />
                <SkeletonBlock className={styles.statValue} tone="strong" />
              </div>
            </div>
          </article>

          <article className={styles.cashCard}>
            <div className={styles.cashCopy}>
              <SkeletonBlock className={styles.cashLabel} />
              <SkeletonBlock className={styles.cashAmount} tone="strong" />
            </div>
            <SkeletonBlock className={styles.chargeButton} />
          </article>

          <article className={styles.guideCard}>
            <div className={styles.guideCopy}>
              <SkeletonBlock className={styles.guideEyebrow} />
              <SkeletonBlock className={styles.guideTitle} tone="strong" />
              <SkeletonBlock className={styles.guideMeta} />
            </div>
            <SkeletonBlock className={styles.guideBadge} />
          </article>
        </section>

        <section className={styles.rightColumn}>
          <article className={styles.menuSection}>
            <SkeletonBlock className={styles.menuSectionTitle} tone="strong" />
            <div className={styles.menuList}>
              {Array.from({ length: MENU_ROW_COUNT }, (_, index) => (
                <div className={styles.menuRow} key={`menu-${index}`}>
                  <SkeletonBlock className={styles.menuIcon} />
                  <SkeletonBlock className={styles.menuLabel} tone="strong" />
                  <SkeletonBlock className={styles.menuMeta} />
                </div>
              ))}
            </div>
          </article>

          <article className={styles.menuSection}>
            <SkeletonBlock className={styles.menuSectionTitle} tone="strong" />
            <div className={styles.menuList}>
              {Array.from({ length: SUPPORT_ROW_COUNT }, (_, index) => (
                <div className={styles.menuRow} key={`support-${index}`}>
                  <SkeletonBlock className={styles.menuIcon} />
                  <SkeletonBlock className={styles.menuLabel} tone="strong" />
                  <SkeletonBlock className={styles.menuMeta} />
                </div>
              ))}
            </div>
          </article>

          <section className={styles.applicationSection}>
            <div className={styles.sectionHeading}>
              <div className={styles.sectionCopy}>
                <SkeletonBlock className={styles.sectionEyebrow} tone="strong" />
                <SkeletonBlock className={styles.sectionTitle} tone="strong" />
              </div>
              <SkeletonBlock className={styles.sectionCount} />
            </div>

            <div className={styles.applicationList}>
              {Array.from({ length: APPLICATION_COUNT }, (_, index) => (
                <article className={styles.applicationCard} key={`application-${index}`}>
                  <div className={styles.applicationTop}>
                    <SkeletonBlock className={styles.statusBadge} />
                    <SkeletonBlock className={styles.detailLink} />
                  </div>
                  <SkeletonBlock className={styles.applicationTitle} tone="strong" />
                  <SkeletonBlock className={styles.applicationVenue} />
                  <SkeletonBlock className={styles.applicationMeta} />
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
