"use client";

import Link from "next/link";
import { useState } from "react";
import type { MatchDetailStatusTone, MatchDetailViewModel } from "./match-detail-types";
import styles from "./match-apply-page.module.css";

type MatchApplyPageProps = {
  accountLabel: string;
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
  isClosed,
  view,
}: MatchApplyPageProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const detailHref = `/match/${view.slug}`;
  const allConfirmed = checkedIds.length === CHECK_ITEMS.length;
  const canSubmit = allConfirmed && !isClosed && !isComplete;

  function toggleCheck(id: string) {
    setCheckedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function handleConfirm() {
    if (!canSubmit) {
      return;
    }

    setIsComplete(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <Link className={styles.backLink} href={detailHref}>
            매치 상세로 돌아가기
          </Link>

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
              <div className={styles.completeBadge}>신청 절차 확인 완료</div>
              <h2 className={styles.sectionTitle}>다음 단계 연결 전까지 여기서 마무리됩니다.</h2>
              <p className={styles.completeText}>
                실제 신청 저장과 결제 연결은 다음 단계에서 추가됩니다. 지금은
                신청 화면과 확인 흐름만 먼저 검증하는 상태입니다.
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
              </section>
            </div>
          )}
        </main>
      </div>

      <div className={styles.actionWrap}>
        <div className={styles.actionBar}>
          <div className={styles.actionCopy}>
            <strong>{isComplete ? "프로토타입 확인 완료" : "신청 전 최종 확인"}</strong>
            <p>
              {isComplete
                ? "실제 신청 저장과 결제 연결은 다음 단계에서 추가됩니다."
                : isClosed
                  ? "마감된 매치는 신청할 수 없습니다."
                  : canSubmit
                    ? "저장과 결제 연결 없이 확인 단계까지만 진행됩니다."
                    : "체크 3개를 모두 완료하면 다음으로 진행됩니다."}
            </p>
          </div>

          {isComplete ? (
            <Link className={styles.primaryLink} href={detailHref}>
              매치 상세로 돌아가기
            </Link>
          ) : (
            <button
              className={styles.primaryButton}
              disabled={!canSubmit}
              onClick={handleConfirm}
              type="button"
            >
              {isClosed ? "신청 마감" : "신청 내용 확인"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
