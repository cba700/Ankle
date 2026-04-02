"use client";

import { useEffect, useState } from "react";
import type { MatchRecord } from "@/lib/matches";
import { MatchCourtSection } from "./match-court-section";
import { MatchDetailHeader } from "./match-detail-header";
import { buildMatchDetailViewModel } from "./match-detail-view-model";
import { MatchHero } from "./match-hero";
import { MatchInfoSection } from "./match-info-section";
import { MatchLevelSection } from "./match-level-section";
import { MatchRefundSection } from "./match-refund-section";
import { MatchRulesSection } from "./match-rules-section";
import { MatchSidebar } from "./match-sidebar";
import { MatchStickyApplyBar } from "./match-sticky-apply-bar";
import { MatchToast } from "./match-toast";
import type { MatchToastState } from "./match-detail-types";
import styles from "./match-detail.module.css";

export function MatchDetail({ match }: { match: MatchRecord }) {
  const view = buildMatchDetailViewModel(match);
  const [saved, setSaved] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [toast, setToast] = useState<MatchToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, tone: MatchToastState["tone"] = "default") {
    setToast({ message, tone });
  }

  async function copyToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, "success");
    } catch {
      showToast("복사에 실패했습니다. 다시 시도해 주세요.", "accent");
    }
  }

  function handlePrevImage() {
    if (view.images.length <= 1) {
      return;
    }

    setImageIndex((current) =>
      current === 0 ? view.images.length - 1 : current - 1,
    );
  }

  function handleNextImage() {
    if (view.images.length <= 1) {
      return;
    }

    setImageIndex((current) => (current + 1) % view.images.length);
  }

  function handleApply() {
    showToast("바로 신청 흐름은 다음 단계에서 로그인과 결제로 연결됩니다.", "accent");
  }

  function handleReserve() {
    showToast("자리 맡기 기능은 운영 플로우 연결 전 단계입니다.", "default");
  }

  function handleSave() {
    setSaved((current) => {
      const next = !current;
      showToast(
        next ? "관심 매치에 추가했어요." : "관심 매치에서 제거했어요.",
        "success",
      );
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <MatchDetailHeader />
      <MatchHero
        courtName={view.courtName}
        imageIndex={imageIndex}
        images={view.images}
        onCopyShare={() => copyToClipboard(window.location.href, "페이지 링크를 복사했어요.")}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
      />

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
              <span>{view.participantSummary}</span>
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
          <MatchSidebar
            address={view.address}
            courtName={view.courtName}
            dateText={view.dateText}
            likes={view.likes}
            mapUrl={view.mapUrl}
            notice={view.notice}
            participantSummary={view.participantSummary}
            priceLabel={view.priceLabel}
            saved={saved}
            time={view.time}
            views={view.views}
            onApply={handleApply}
            onCopyAddress={() => copyToClipboard(view.address, "주소를 복사했어요.")}
            onOpenCancelInfo={() =>
              showToast("취소 걱정 안내는 다음 단계에서 별도 정책 화면과 연결됩니다.", "default")
            }
            onOpenFaq={() =>
              showToast("매치 전 안내 FAQ는 다음 단계에서 연결됩니다.", "default")
            }
            onReserve={handleReserve}
            onSave={handleSave}
          />
        </aside>
      </main>

      <MatchStickyApplyBar
        onApply={handleApply}
        participantSummary={view.participantSummary}
        priceLabel={view.priceLabel}
      />

      {toast ? <MatchToast message={toast.message} tone={toast.tone} /> : null}
    </div>
  );
}
