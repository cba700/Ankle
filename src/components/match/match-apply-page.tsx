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
import type { MatchDetailViewModel } from "./match-detail-types";
import styles from "./match-apply-page.module.css";

type MatchApplyPageProps = {
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
  const [feedbackMessage, setFeedbackMessage] = useState(
    alreadyApplied ? "이미 신청이 완료된 매치입니다." : null,
  );

  const detailHref = `/match/${view.publicId}`;
  const applyPath = `${detailHref}/apply`;
  const allConfirmed = checkedIds.length === CHECK_ITEMS.length || alreadyApplied;
  const canSubmit = allConfirmed && canApply && !isComplete && !isSubmitting;
  const selectedCoupon = availableCoupons[0] ?? null;
  const selectedCouponId = selectedCoupon?.id ?? null;
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

          <section className={styles.topBanner}>
            <div className={styles.bannerCopy}>
              <p className={styles.bannerDate}>{view.dateText}</p>
              <strong className={styles.bannerTime}>{view.time}</strong>
              <span className={styles.bannerPlace}>{view.courtName}</span>
            </div>
            <div className={styles.bannerMark} aria-hidden="true">
              ANKLE
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
            <div className={styles.stack}>
              <section className={styles.card}>
                <div className={styles.listRow}>
                  <span className={styles.rowLabel}>내 쿠폰</span>
                  <span className={styles.rowValue}>
                    {selectedCoupon ? `${selectedCoupon.name} 자동 적용` : "쿠폰 없음"}
                  </span>
                </div>
                <div className={styles.listRow}>
                  <span className={styles.rowLabel}>캐시/포인트</span>
                  <span className={styles.rowValueGroup}>
                    <strong>{finalChargeLabel} 사용</strong>
                    <small>잔액 {cashBalanceLabel}</small>
                  </span>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>결제 금액</h2>
                <div className={styles.priceSummaryList}>
                  <div className={styles.priceSummaryRow}>
                    <span>이용 금액</span>
                    <strong>{priceSummary.originalPriceLabel}</strong>
                  </div>
                  {selectedCoupon ? (
                    <div className={styles.priceSummaryRow}>
                      <span>쿠폰 할인</span>
                      <strong className={styles.discountValue}>-{selectedCoupon.discountLabel}</strong>
                    </div>
                  ) : null}
                  <div className={styles.priceSummaryRow}>
                    <span>캐시 사용</span>
                    <strong className={styles.discountValue}>-{finalChargeLabel}</strong>
                  </div>
                  <div className={`${styles.priceSummaryRow} ${styles.priceSummaryRowStrong}`}>
                    <span>최종 결제 금액</span>
                    <strong>0원</strong>
                  </div>
                </div>
              </section>

              <section className={styles.card}>
                <h2 className={styles.sectionTitle}>부가 정보</h2>
                <label className={styles.formField}>
                  <span>주차등록</span>
                  <input placeholder="12가 1234" type="text" />
                </label>
                <label className={styles.formField}>
                  <span>현금영수증</span>
                  <select defaultValue="income">
                    <option value="income">소득공제</option>
                    <option value="none">신청 안 함</option>
                  </select>
                </label>
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
            <p>
              {isComplete
                ? "현재 계정 기준 신청과 캐시 차감이 반영되었습니다."
                : "신청 시 이용약관 및 개인정보 처리방침에 동의한 것으로 간주됩니다."}
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
              {!canApply ? "신청 마감" : isSubmitting ? "신청 처리 중..." : "신청하기"}
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
