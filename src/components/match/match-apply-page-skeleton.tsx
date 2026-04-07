import { SkeletonBlock } from "@/components/skeleton/skeleton";
import styles from "./match-apply-page-skeleton.module.css";

const CHECK_ITEM_COUNT = 3;

export function MatchApplyPageSkeleton() {
  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <SkeletonBlock className={styles.backLink} />

          <section className={styles.heroCard}>
            <SkeletonBlock className={styles.eyebrow} tone="strong" />
            <div className={styles.heroTop}>
              <div className={styles.heroCopy}>
                <SkeletonBlock className={styles.status} />
                <SkeletonBlock className={styles.titlePrimary} tone="strong" />
                <SkeletonBlock className={styles.titleSecondary} tone="strong" />
              </div>
              <SkeletonBlock className={styles.price} tone="strong" />
            </div>
            <SkeletonBlock className={styles.subTitle} />
            <div className={styles.metaRow}>
              <SkeletonBlock className={styles.metaPill} />
              <SkeletonBlock className={styles.metaPillWide} />
            </div>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.card}>
              <SkeletonBlock className={styles.sectionTitle} tone="strong" />
              <SkeletonBlock className={styles.sectionLineLong} />
              <div className={styles.accountBox}>
                <SkeletonBlock className={styles.accountLabel} />
                <SkeletonBlock className={styles.accountValue} tone="strong" />
              </div>
            </section>

            <section className={styles.card}>
              <SkeletonBlock className={styles.sectionTitle} tone="strong" />
              <div className={styles.policyList}>
                <SkeletonBlock className={styles.policyRow} />
                <SkeletonBlock className={styles.policyRow} />
                <SkeletonBlock className={styles.policyRow} />
              </div>
            </section>

            <section className={styles.card}>
              <SkeletonBlock className={styles.sectionTitle} tone="strong" />
              <SkeletonBlock className={styles.noticeBox} />
            </section>
          </div>

          <section className={styles.card}>
            <SkeletonBlock className={styles.sectionTitle} tone="strong" />
            <SkeletonBlock className={styles.sectionLine} />
            <div className={styles.checkboxList}>
              {Array.from({ length: CHECK_ITEM_COUNT }, (_, index) => (
                <div className={styles.checkboxRow} key={`check-${index}`}>
                  <SkeletonBlock className={styles.checkbox} />
                  <SkeletonBlock className={styles.checkboxLabel} />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <div className={styles.actionWrap}>
        <div className={styles.actionBar}>
          <div className={styles.actionCopy}>
            <SkeletonBlock className={styles.actionTitle} tone="strong" />
            <SkeletonBlock className={styles.actionText} />
          </div>
          <SkeletonBlock className={styles.actionButton} tone="strong" />
        </div>
      </div>
    </div>
  );
}
