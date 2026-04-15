"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import {
  buildLoginHref,
  buildVerifyPhoneHref,
  buildWelcomeHref,
} from "@/lib/auth/redirect";
import { formatMoney } from "@/lib/date";
import type { MatchDetailStatusTone, MatchDetailViewModel } from "./match-detail-types";
import styles from "./match-apply-page.module.css";

type MatchApplyPageProps = {
  accountLabel: string;
  alreadyApplied: boolean;
  availableCoupons: MatchApplyCouponOption[];
  canApply: boolean;
  cashBalanceLabel: string;
  priceSummary: {
    originalPriceAmount: number;
    originalPriceLabel: string;
  };
  view: MatchDetailViewModel;
};

type MatchApplyCouponOption = {
  discountAmount: number;
  discountLabel: string;
  id: string;
  name: string;
};

const CHECK_ITEMS = [
  { id: "schedule", label: "일정과 장소를 다시 확인했습니다." },
  { id: "refund", label: "환불 정책과 취소 기준을 확인했습니다." },
  { id: "rules", label: "운영 규칙과 현장 밸런스 배정을 이해했습니다." },
] as const;

export function MatchApplyPage({
  accountLabel,
  alreadyApplied,
  availableCoupons,
  canApply,
  cashBalanceLabel,
  priceSummary,
  view,
}: MatchApplyPageProps) {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(alreadyApplied);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(
    availableCoupons[0]?.id ?? null,
  );
  const [feedbackMessage, setFeedbackMessage] = useState(
    alreadyApplied ? "이미 신청이 완료된 매치입니다." : null,
  );

  const detailHref = `/match/${view.publicId}`;
  const applyPath = `${detailHref}/apply`;
  const allConfirmed = checkedIds.length === CHECK_ITEMS.length || alreadyApplied;
  const canSubmit = allConfirmed && canApply && !isComplete && !isSubmitting;
  const selectedCoupon =
    availableCoupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
  const couponDiscountAmount = selectedCoupon?.discountAmount ?? 0;
  const finalChargeAmount = Math.max(priceSummary.originalPriceAmount - couponDiscountAmount, 0);
  const finalChargeLabel = `${formatMoney(finalChargeAmount)}원`;

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
        body: JSON.stringify({ couponId: selectedCouponId }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            code?: string;
            couponApplied?: boolean;
            couponDiscountAmount?: number;
            debitedAmount?: number;
            remainingCash?: number;
          }
        | null;

      if (response.ok || payload?.code === "ALREADY_APPLIED") {
        setIsComplete(true);
        setFeedbackMessage(
          payload?.code === "ALREADY_APPLIED"
            ? "이미 신청이 완료된 매치입니다."
            : buildSuccessMessage(payload),
        );
        startTransition(() => router.refresh());
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (response.status === 401) {
        window.location.href = buildLoginHref(applyPath);
        return;
      }

      if (payload?.code === "INSUFFICIENT_CASH") {
        window.location.href = `/cash/charge?next=${encodeURIComponent(applyPath)}`;
        return;
      }

      if (payload?.code === "ONBOARDING_REQUIRED") {
        window.location.href = buildWelcomeHref(applyPath);
        return;
      }

      if (payload?.code === "PHONE_VERIFICATION_REQUIRED") {
        window.location.href = buildVerifyPhoneHref(applyPath);
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
              <span>{view.address}</span>
            </div>
          </section>

          {isComplete ? (
            <section className={styles.completeCard}>
              <div className={styles.completeBadge}>
                {alreadyApplied ? "이미 신청된 매치" : "신청 완료"}
              </div>
              <h2 className={styles.sectionTitle}>매치 참가가 계정에 확정되었습니다.</h2>
              <p className={styles.completeText}>
                {feedbackMessage ??
                  "캐시 차감과 신청 확정이 함께 반영되었습니다."}
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
                <div className={styles.accountBox}>
                  <span className={styles.accountLabel}>현재 보유 캐시</span>
                  <strong className={styles.accountValue}>{cashBalanceLabel}</strong>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.fieldset}>
                  <div className={styles.priceSummaryHeader}>
                    <h2 className={styles.sectionTitle}>쿠폰 선택</h2>
                    <span className={styles.couponBadge}>{availableCoupons.length}장 보유</span>
                  </div>
                  <p className={styles.sectionDescription}>신청할 때는 쿠폰 1장만 사용할 수 있습니다.</p>

                  <div className={styles.couponOptionList}>
                    <label
                      className={`${styles.couponOption} ${
                        selectedCouponId === null ? styles.couponOptionSelected : ""
                      }`}
                    >
                      <input
                        checked={selectedCouponId === null}
                        className={styles.couponOptionInput}
                        name="coupon"
                        onChange={() => setSelectedCouponId(null)}
                        type="radio"
                      />
                      <span className={styles.couponOptionCopy}>
                        <strong className={styles.couponOptionName}>쿠폰 없이 진행</strong>
                        <span className={styles.couponOptionMeta}>정가 그대로 차감</span>
                      </span>
                      <strong className={styles.couponOptionAmount}>
                        {priceSummary.originalPriceLabel}
                      </strong>
                    </label>

                    {availableCoupons.map((coupon) => (
                      <label
                        className={`${styles.couponOption} ${
                          selectedCouponId === coupon.id ? styles.couponOptionSelected : ""
                        }`}
                        key={coupon.id}
                      >
                        <input
                          checked={selectedCouponId === coupon.id}
                          className={styles.couponOptionInput}
                          name="coupon"
                          onChange={() => setSelectedCouponId(coupon.id)}
                          type="radio"
                        />
                        <span className={styles.couponOptionCopy}>
                          <strong className={styles.couponOptionName}>{coupon.name}</strong>
                          <span className={styles.couponOptionMeta}>{coupon.discountLabel} 할인</span>
                        </span>
                        <strong className={styles.couponOptionAmount}>{coupon.discountLabel}</strong>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <div className={styles.priceSummaryHeader}>
                  <h2 className={styles.sectionTitle}>차감 요약</h2>
                  {selectedCoupon ? (
                    <span className={styles.couponBadge}>{selectedCoupon.name}</span>
                  ) : null}
                </div>
                <div className={styles.priceSummaryList}>
                  <div className={styles.priceSummaryRow}>
                    <span>참가비</span>
                    <strong>{priceSummary.originalPriceLabel}</strong>
                  </div>
                  {selectedCoupon ? (
                    <div className={styles.priceSummaryRow}>
                      <span>{selectedCoupon.name}</span>
                      <strong className={styles.discountValue}>-{selectedCoupon.discountLabel}</strong>
                    </div>
                  ) : null}
                  <div className={`${styles.priceSummaryRow} ${styles.priceSummaryRowStrong}`}>
                    <span>최종 차감</span>
                    <strong>{finalChargeLabel}</strong>
                  </div>
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

                {!canApply ? (
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
            <strong>{isComplete ? "신청 확정 완료" : "신청 전 최종 확인"}</strong>
            <p>
              {isComplete
                ? "현재 계정 기준 신청과 캐시 차감이 반영되었습니다."
                : !canApply
                  ? "마감된 매치는 신청할 수 없습니다."
                  : canSubmit
                    ? "체크 완료 후 캐시 차감과 함께 신청이 확정됩니다."
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
              {!canApply ? "신청 마감" : isSubmitting ? "신청 처리 중..." : "캐시로 신청 확정"}
            </button>
          )}
        </div>
      </div>

      <LegalFooter />
    </div>
  );
}

function getErrorMessage(code?: string) {
  if (code === "MATCH_FULL") {
    return "정원이 모두 차서 신청할 수 없습니다.";
  }

  if (code === "INSUFFICIENT_CASH") {
    return "보유 캐시가 부족해 충전 페이지로 이동합니다.";
  }

  if (code === "MATCH_STARTED") {
    return "이미 시작된 매치라 신청할 수 없습니다.";
  }

  if (code === "ONBOARDING_REQUIRED") {
    return "신청 전 임시 레벨과 선호 시간을 먼저 설정해 주세요.";
  }

  if (code === "MATCH_NOT_OPEN") {
    return "현재 모집 중인 매치가 아닙니다.";
  }

  if (code === "MATCH_NOT_FOUND") {
    return "매치를 찾을 수 없습니다.";
  }

  if (code === "INVALID_COUPON") {
    return "사용 가능한 쿠폰이 아닙니다. 다시 선택해 주세요.";
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

function buildSuccessMessage(payload?: {
  couponApplied?: boolean;
  couponDiscountAmount?: number;
  debitedAmount?: number;
} | null) {
  const debitedAmount = payload?.debitedAmount ?? 0;
  const couponDiscountAmount = payload?.couponDiscountAmount ?? 0;

  if (payload?.couponApplied && couponDiscountAmount > 0 && debitedAmount === 0) {
    return `쿠폰 ${formatMoney(couponDiscountAmount)}원 적용으로 차감 없이 신청이 확정되었습니다.`;
  }

  if (payload?.couponApplied && couponDiscountAmount > 0) {
    return `쿠폰 ${formatMoney(couponDiscountAmount)}원 적용 후 ${formatMoney(debitedAmount)}원 차감되었습니다.`;
  }

  return `캐시 ${formatMoney(debitedAmount)}원 차감으로 신청이 확정되었습니다.`;
}
