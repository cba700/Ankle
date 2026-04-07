"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLink } from "@/components/navigation/app-link";
import { buildLoginHref } from "@/lib/auth/redirect";
import type { MatchDetailStatusTone, MatchDetailViewModel } from "./match-detail-types";
import styles from "./match-apply-page.module.css";

type MatchApplyPageProps = {
  accountLabel: string;
  alreadyApplied: boolean;
  isClosed: boolean;
  view: MatchDetailViewModel;
};

const CHECK_ITEMS = [
  { id: "schedule", label: "일정과 장소를 다시 확인했습니다." },
  { id: "refund", label: "환불 정책과 취소 기준을 확인했습니다." },
  { id: "rules", label: "운영 규칙과 현장 밸런스 배정을 이해했습니다." },
] as const;

export function MatchApplyPage({
  accountLabel,
  alreadyApplied,
  isClosed,
  view,
}: MatchApplyPageProps) {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(alreadyApplied);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(
    alreadyApplied ? "이미 신청이 완료된 매치입니다." : null,
  );

  const detailHref = `/match/${view.slug}`;
  const applyPath = `${detailHref}/apply`;
  const allConfirmed = checkedIds.length === CHECK_ITEMS.length || alreadyApplied;
  const canSubmit = allConfirmed && !isClosed && !isComplete && !isSubmitting;

  function toggleCheck(id: string) {
    setCheckedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleConfirm() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/matches/${view.id}/applications`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { code?: string }
        | null;

      if (response.ok || payload?.code === "ALREADY_APPLIED") {
        setIsComplete(true);
        setFeedbackMessage(
          payload?.code === "ALREADY_APPLIED"
            ? "이미 신청이 완료된 매치입니다."
            : "현재 계정으로 매치 신청이 저장되었습니다.",
        );
        startTransition(() => router.refresh());
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (response.status === 401) {
        window.location.href = buildLoginHref(applyPath);
        return;
      }

      setFeedbackMessage(getErrorMessage(payload?.code));
    } catch {
      setFeedbackMessage("신청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <AppLink className={styles.backLink} href={detailHref}>
            매치 상세로 돌아가기
          </AppLink>

          <section className={styles.heroCard}>
            <p className={styles.eyebrow}>Match Apply</p>
            <div className={styles.heroTop}>
              <div>
                <div className={getStatusClassName(view.statusTone, styles)}>
                  {view.statusLabel}
                </div>
                <h1 className={styles.title}>{view.title}</h1>
              </div>
              <strong className={styles.price}>{view.priceLabel}</strong>
            </div>
            <p className={styles.subTitle}>
              {view.dateText} {view.time} · {view.courtName}
            </p>
            <div className={styles.metaRow}>
              <span>{view.participantSummary}</span>
              <span>{view.address}</span>
            </div>
          </section>

          {isComplete ? (
            <section className={styles.completeCard}>
              <div className={styles.completeBadge}>
                {alreadyApplied ? "이미 신청된 매치" : "신청 완료"}
              </div>
              <h2 className={styles.sectionTitle}>매치 참가가 계정에 저장되었습니다.</h2>
              <p className={styles.completeText}>
                {feedbackMessage ??
                  "결제 연동 전 단계라 별도 결제는 진행되지 않았고, 신청 상태만 먼저 저장됩니다."}
              </p>
            </section>
          ) : (
            <div className={styles.contentGrid}>
              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>신청 계정</h2>
                <p className={styles.sectionDescription}>
                  추가 입력 없이 현재 로그인된 계정으로만 진행합니다.
                </p>
                <div className={styles.accountBox}>
                  <span className={styles.accountLabel}>카카오 계정</span>
                  <strong className={styles.accountValue}>{accountLabel}</strong>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>신청 전 확인</h2>
                <p className={styles.sectionDescription}>
                  일정과 운영 방식, 환불 기준을 마지막으로 확인해 주세요.
                </p>
                <div className={styles.policyPanel}>
                  <strong className={styles.policyTitle}>환불 기준</strong>
                  <ul className={styles.policyList}>
                    {view.refundRows.map((row) => (
                      <li className={styles.policyItem} key={row.condition}>
                        <span>{row.condition}</span>
                        <strong>{row.policy}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={styles.noticeBox}>
                  <p>{view.notice}</p>
                  <p>{view.levelHint}</p>
                </div>
              </section>

              <section className={styles.card}>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.sectionTitle}>체크리스트</legend>
                  <p className={styles.sectionDescription}>
                    아래 3개를 모두 확인해야 다음 단계로 이동할 수 있습니다.
                  </p>

                  <div className={styles.checkboxList}>
                    {CHECK_ITEMS.map((item) => (
                      <label className={styles.checkboxRow} key={item.id}>
                        <input
                          checked={checkedIds.includes(item.id)}
                          className={styles.checkbox}
                          onChange={() => toggleCheck(item.id)}
                          type="checkbox"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {isClosed ? (
                  <p className={styles.warningText}>
                    현재 마감된 매치라 신청을 진행할 수 없습니다.
                  </p>
                ) : null}
                {feedbackMessage ? (
                  <p className={styles.warningText}>{feedbackMessage}</p>
                ) : null}
              </section>
            </div>
          )}
        </main>
      </div>

      <div className={styles.actionWrap}>
        <div className={styles.actionBar}>
          <div className={styles.actionCopy}>
            <strong>{isComplete ? "신청 저장 완료" : "신청 전 최종 확인"}</strong>
            <p>
              {isComplete
                ? "현재 계정 기준 신청 상태가 저장되었습니다."
                : isClosed
                  ? "마감된 매치는 신청할 수 없습니다."
                  : canSubmit
                    ? "체크 완료 후 바로 신청이 저장됩니다."
                    : "체크 3개를 모두 완료하면 다음으로 진행됩니다."}
            </p>
          </div>

          {isComplete ? (
            <AppLink className={styles.primaryLink} href={detailHref}>
              매치 상세로 돌아가기
            </AppLink>
          ) : (
            <button
              className={styles.primaryButton}
              disabled={!canSubmit}
              onClick={handleConfirm}
              type="button"
            >
              {isClosed ? "신청 마감" : isSubmitting ? "신청 저장 중..." : "신청 확정"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(code?: string) {
  if (code === "MATCH_FULL") {
    return "정원이 모두 차서 신청할 수 없습니다.";
  }

  if (code === "MATCH_STARTED") {
    return "이미 시작된 매치라 신청할 수 없습니다.";
  }

  if (code === "MATCH_NOT_OPEN") {
    return "현재 모집 중인 매치가 아닙니다.";
  }

  if (code === "MATCH_NOT_FOUND") {
    return "매치를 찾을 수 없습니다.";
  }

  return "신청 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function getStatusClassName(
  tone: MatchDetailStatusTone,
  classNames: Record<string, string>,
) {
  if (tone === "danger") {
    return `${classNames.statusPill} ${classNames.statusDanger}`;
  }

  if (tone === "accent") {
    return `${classNames.statusPill} ${classNames.statusAccent}`;
  }

  if (tone === "open") {
    return `${classNames.statusPill} ${classNames.statusOpen}`;
  }

  return `${classNames.statusPill} ${classNames.statusNeutral}`;
}
