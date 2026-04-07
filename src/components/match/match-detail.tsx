import type { MatchRecord } from "@/lib/matches";
import { MatchCourtSection } from "./match-court-section";
import { MatchDetailHeader } from "./match-detail-header";
import { MatchDetailFeedbackProvider } from "./match-detail-feedback";
import { MatchDetailHeroClient } from "./match-detail-hero-client";
import { MatchDetailSidebarClient } from "./match-detail-sidebar-client";
import { buildMatchDetailViewModel } from "./match-detail-view-model";
import { MatchInfoSection } from "./match-info-section";
import { MatchLevelSection } from "./match-level-section";
import { MatchRefundSection } from "./match-refund-section";
import { MatchRulesSection } from "./match-rules-section";
import { MatchStickyApplyBar } from "./match-sticky-apply-bar";
import styles from "./match-detail.module.css";

export function MatchDetail({ match }: { match: MatchRecord }) {
  const view = buildMatchDetailViewModel(match);
  const applyHref = `/match/${match.slug}/apply`;
  const canApply = match.status.kind !== "closed";

  return (
    <MatchDetailFeedbackProvider>
      <div className={styles.page}>
        <MatchDetailHeader />
        <MatchDetailHeroClient courtName={view.courtName} images={view.images} />

        <main className={styles.body}>
          <div className={styles.contentColumn}>
            <section className={styles.leadCard}>
              <div
                className={`${styles.statusPill} ${
                  view.statusTone === "danger"
                    ? styles.statusDanger
                    : view.statusTone === "accent"
                      ? styles.statusAccent
                      : view.statusTone === "open"
                        ? styles.statusOpen
                        : styles.statusNeutral
                }`}
              >
                {view.statusLabel}
              </div>
              <h1 className={styles.title}>{view.title}</h1>
              <p className={styles.subTitle}>
                {view.dateText} {view.time} · {view.courtName}
              </p>
              <div className={styles.quickMeta}>
                <span>{view.priceLabel}</span>
              </div>
            </section>

            <MatchInfoSection infoItems={view.infoItems} views={view.views} />
            <MatchLevelSection
              averageLevel={view.averageLevel}
              distribution={view.levelDistribution}
              hint={view.levelHint}
            />
            <MatchCourtSection facilities={view.facilities} notes={view.courtNotes} />
            <MatchRulesSection howTo={view.howTo} rules={view.rules} />
            <MatchRefundSection refundRows={view.refundRows} />
          </div>

          <aside className={styles.sidebarColumn}>
            <MatchDetailSidebarClient
              applyHref={applyHref}
              canApply={canApply}
              view={view}
            />
          </aside>
        </main>

        <MatchStickyApplyBar
          applyHref={applyHref}
          canApply={canApply}
          priceLabel={view.priceLabel}
        />
      </div>
    </MatchDetailFeedbackProvider>
  );
}
