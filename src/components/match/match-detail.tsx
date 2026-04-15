import { Suspense } from "react";
import type { MatchRecord } from "@/lib/matches";
import { LegalFooter } from "@/components/legal/legal-footer";
import { MatchCourtSection } from "./match-court-section";
import { MatchDetailBackLink } from "./match-detail-back-link";
import { MatchDetailHeader } from "./match-detail-header";
import { MatchDetailFeedbackProvider } from "./match-detail-feedback";
import { MatchDetailHeroClient } from "./match-detail-hero-client";
import { MatchDetailSidebarClient } from "./match-detail-sidebar-client";
import { buildMatchDetailViewModel } from "./match-detail-view-model";
import { MatchInfoSection } from "./match-info-section";
import { MatchLevelSection } from "./match-level-section";
import { MatchRefundSection } from "./match-refund-section";
import { MatchRulesSection } from "./match-rules-section";
import { MatchSafetySection } from "./match-safety-section";
import { MatchStickyApplyBar } from "./match-sticky-apply-bar";
import styles from "./match-detail.module.css";

export function MatchDetail({
  match,
}: {
  match: MatchRecord;
}) {
  const view = buildMatchDetailViewModel(match);
  const applyHref = `/match/${match.publicId}/apply`;
  const canApply = match.canApply;

  return (
    <MatchDetailFeedbackProvider>
      <div className={styles.page}>
        <MatchDetailHeader />
        <div className={styles.backBar}>
          <Suspense fallback={<a className={styles.backLink} href="/">← 매치 목록으로</a>}>
            <MatchDetailBackLink className={styles.backLink} />
          </Suspense>
        </div>
        <MatchDetailHeroClient
          courtName={view.courtName}
          dateText={view.dateText}
          images={view.images}
          statusLabel={view.statusLabel}
          statusTone={view.statusTone}
          time={view.time}
          title={view.title}
        />

        <main className={styles.body}>
          <div className={styles.contentColumn}>
            <MatchInfoSection infoItems={view.infoItems} />
            <MatchLevelSection distribution={view.levelDistribution} />
            <MatchCourtSection facilities={view.facilities} notes={view.courtNotes} />
            <MatchRulesSection howTo={view.howTo} rules={view.rules} />
            <MatchSafetySection items={view.safetyNotes} />
            <MatchRefundSection />
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

        <LegalFooter />
      </div>
    </MatchDetailFeedbackProvider>
  );
}
