"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { MyPageCashTransaction } from "@/lib/mypage";
import { BrandLogo } from "@/components/branding/brand-logo";
import {
  CASH_REFUND_ELIGIBILITY_NOTICE,
  CASH_REFUND_HOLIDAY_NOTICE,
  CASH_REFUND_ORIGINAL_METHOD_NOTICE,
  CASH_REFUND_SCHEDULE_NOTICE,
} from "@/lib/refund-policy";
import {
  ArrowLeftIcon,
  WalletIcon,
} from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-cash.module.css";

type PendingCashRefundRequest = {
  createdAtLabel: string;
  requestedAmountLabel: string;
};

type MyPageCashProps = {
  cashBalanceLabel: string;
  cashTransactions: MyPageCashTransaction[];
  initialIsAdmin: boolean;
  pendingRefundRequest: PendingCashRefundRequest | null;
  refundableCashAmount: number;
  refundableCashLabel: string;
};

type CashHistoryTab = "all" | "charge" | "refund" | "usage";

type RefundSubmitResponse =
  | {
      code?: string;
      message?: string;
      ok?: boolean;
    }
  | null;

const CASH_HISTORY_TABS: Array<{ id: CashHistoryTab; label: string }> = [
  { id: "all", label: "전체" },
  { id: "charge", label: "충전" },
  { id: "usage", label: "사용/취소" },
  { id: "refund", label: "환불" },
];

export function MyPageCash({
  cashBalanceLabel,
  cashTransactions,
  initialIsAdmin,
  pendingRefundRequest,
  refundableCashAmount,
  refundableCashLabel,
}: MyPageCashProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CashHistoryTab>("all");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [agreedToSchedule, setAgreedToSchedule] = useState(false);
  const [refundErrorMessage, setRefundErrorMessage] = useState<string | null>(null);
  const [isSubmittingRefundRequest, setIsSubmittingRefundRequest] = useState(false);
  const filteredTransactions = useMemo(
    () => cashTransactions.filter((transaction) => matchesCashHistoryTab(transaction, activeTab)),
    [activeTab, cashTransactions],
  );
  const canOpenRefundRequest = !pendingRefundRequest && refundableCashAmount > 0;
  const canSubmitRefundRequest =
    !isSubmittingRefundRequest &&
    canOpenRefundRequest &&
    agreedToSchedule;

  useEffect(() => {
    if (!isRefundModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmittingRefundRequest) {
        setIsRefundModalOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRefundModalOpen, isSubmittingRefundRequest]);

  async function handleSubmitRefundRequest() {
    if (!canSubmitRefundRequest) {
      return;
    }

    setRefundErrorMessage(null);
    setIsSubmittingRefundRequest(true);

    try {
      const response = await fetch("/api/cash/refund-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agreedToPolicy: agreedToSchedule,
        }),
      });

      const payload = (await response.json().catch(() => null)) as RefundSubmitResponse;

      if (!response.ok || !payload?.ok) {
        setRefundErrorMessage(
          payload?.message ?? "환불 신청을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );

        if (
          payload?.code === "PENDING_REFUND_REQUEST_EXISTS" ||
          payload?.code === "NO_REFUNDABLE_CASH"
        ) {
          setIsRefundModalOpen(false);
          router.refresh();
        }

        return;
      }

      resetRefundForm();
      setIsRefundModalOpen(false);
      router.refresh();
    } catch {
      setRefundErrorMessage("환불 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSubmittingRefundRequest(false);
    }
  }

  function handleOpenRefundRequest() {
    if (!canOpenRefundRequest) {
      return;
    }

    setRefundErrorMessage(null);
    setIsRefundModalOpen(true);
  }

  function handleCloseRefundRequest() {
    if (isSubmittingRefundRequest) {
      return;
    }

    setIsRefundModalOpen(false);
    setRefundErrorMessage(null);
  }

  function resetRefundForm() {
    setAgreedToSchedule(false);
    setRefundErrorMessage(null);
  }

  const refundButtonLabel = pendingRefundRequest
    ? "환불 처리 중"
    : refundableCashAmount > 0
      ? "캐시 환불"
      : "환불 가능 금액 없음";

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <BrandLogo className={baseStyles.brandLogo} priority />
          </AppLink>

          <div className={baseStyles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={initialIsAdmin}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={`pageShell ${styles.main}`}>
        <AppLink className={styles.backLink} href="/mypage">
          <ArrowLeftIcon className={styles.backIcon} />
          마이페이지로 돌아가기
        </AppLink>

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <WalletIcon className={styles.heroBadgeIcon} />
              Cash Ledger
            </span>
            <p className={styles.heroEyebrow}>나의 캐시</p>
            <h1 className={styles.heroTitle}>{cashBalanceLabel}</h1>
          </div>

          <div className={styles.heroActions}>
            <button
              className={styles.secondaryButton}
              disabled={!canOpenRefundRequest}
              onClick={handleOpenRefundRequest}
              type="button"
            >
              {refundButtonLabel}
            </button>
            <AppLink className={styles.primaryButton} href="/cash/charge">
              충전하기
            </AppLink>
          </div>
        </section>

        {pendingRefundRequest ? (
          <section className={styles.feedbackBox}>
            <strong>환불 신청 접수됨</strong>
            <p className={styles.feedbackDescription}>
              {CASH_REFUND_SCHEDULE_NOTICE} {CASH_REFUND_HOLIDAY_NOTICE}
            </p>
            <div className={styles.requestSummaryGrid}>
              <div className={styles.requestSummaryRow}>
                <span className={styles.requestSummaryLabel}>신청 금액</span>
                <strong className={styles.requestSummaryValue}>
                  {pendingRefundRequest.requestedAmountLabel}
                </strong>
              </div>
              <div className={styles.requestSummaryRow}>
                <span className={styles.requestSummaryLabel}>환불 방식</span>
                <strong className={styles.requestSummaryValue}>결제했던 수단</strong>
              </div>
              <div className={styles.requestSummaryRow}>
                <span className={styles.requestSummaryLabel}>접수 시각</span>
                <strong className={styles.requestSummaryValue}>
                  {pendingRefundRequest.createdAtLabel}
                </strong>
              </div>
            </div>
          </section>
        ) : null}

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <h2 className={baseStyles.sectionTitle}>캐시 상세 내역</h2>
            </div>
            <span className={baseStyles.sectionCount}>{filteredTransactions.length}건</span>
          </div>

          <div className={styles.tabList}>
            {CASH_HISTORY_TABS.map((tab) => {
              const isActive = tab.id === activeTab;

              return (
                <button
                  aria-pressed={isActive}
                  className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className={baseStyles.emptyState}>
              <strong>{getCashHistoryEmptyTitle(activeTab)}</strong>
              <p>{getCashHistoryEmptyDescription(activeTab)}</p>
              {activeTab === "all" || activeTab === "charge" ? (
                <AppLink className={baseStyles.homeLink} href="/cash/charge">
                  캐시 충전하러 가기
                </AppLink>
              ) : null}
            </div>
          ) : (
            <div className={baseStyles.cashTransactionList}>
              {filteredTransactions.map((transaction) => (
                <article className={baseStyles.cashTransactionCard} key={transaction.id}>
                  <div className={baseStyles.cashTransactionTop}>
                    <strong className={baseStyles.cashTransactionTitle}>{transaction.title}</strong>
                    <span
                      className={`${baseStyles.cashTransactionAmount} ${
                        transaction.tone === "danger"
                          ? baseStyles.cashAmountDanger
                          : transaction.tone === "muted"
                            ? baseStyles.cashAmountMuted
                            : baseStyles.cashAmountAccent
                      }`}
                    >
                      {transaction.amountLabel}
                    </span>
                  </div>
                  <p className={baseStyles.cashTransactionMeta}>{transaction.metaLabel}</p>
                  <p className={baseStyles.cashTransactionBalance}>{transaction.balanceLabel}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {isRefundModalOpen ? (
        <CashRefundRequestDialog
          errorMessage={refundErrorMessage}
          isSubmitting={isSubmittingRefundRequest}
          onClose={handleCloseRefundRequest}
          onSubmit={handleSubmitRefundRequest}
          onToggleScheduleAgreement={() => setAgreedToSchedule((current) => !current)}
          requestedAmountLabel={refundableCashLabel}
          scheduleAgreed={agreedToSchedule}
          submitDisabled={!canSubmitRefundRequest}
        />
      ) : null}

      <LegalFooter />
    </div>
  );
}

function CashRefundRequestDialog({
  errorMessage,
  isSubmitting,
  onClose,
  onSubmit,
  onToggleScheduleAgreement,
  requestedAmountLabel,
  scheduleAgreed,
  submitDisabled,
}: {
  errorMessage: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
  onToggleScheduleAgreement: () => void;
  requestedAmountLabel: string;
  scheduleAgreed: boolean;
  submitDisabled: boolean;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.refundDialogRoot}>
      <div
        aria-hidden="true"
        className={styles.refundDialogBackdrop}
        onClick={onClose}
      />

      <section
        aria-labelledby="cash-refund-dialog-title"
        aria-modal="true"
        className={styles.refundDialog}
        role="dialog"
      >
        <div className={styles.refundDialogHeader}>
          <div>
            <p className={styles.refundDialogEyebrow}>Cash Refund</p>
            <h2 className={styles.refundDialogTitle} id="cash-refund-dialog-title">
              환불 신청
            </h2>
            <p className={styles.refundDialogDescription}>
              {CASH_REFUND_ELIGIBILITY_NOTICE}
            </p>
          </div>
          <button
            className={styles.refundDialogClose}
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>

        <form
          className={styles.refundForm}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className={styles.refundReadonlyField}>
            <span className={styles.refundFieldLabel}>현재 신청 가능 금액</span>
            <strong className={styles.refundAmountValue}>{requestedAmountLabel}</strong>
          </div>

          <div className={styles.refundReadonlyField}>
            <span className={styles.refundFieldLabel}>환불 방식</span>
            <strong className={styles.refundAmountValue}>결제했던 수단</strong>
          </div>

          <label className={styles.refundCheckboxRow}>
            <input
              checked={scheduleAgreed}
              className={styles.refundCheckbox}
              onChange={onToggleScheduleAgreement}
              type="checkbox"
            />
            <span className={styles.refundCheckboxLabel}>
              충전 캐시 환불 안내를 확인했습니다. {CASH_REFUND_ORIGINAL_METHOD_NOTICE}{" "}
              {CASH_REFUND_HOLIDAY_NOTICE}
            </span>
          </label>

          {errorMessage ? (
            <p className={styles.refundErrorMessage}>{errorMessage}</p>
          ) : null}

          <div className={styles.refundActionRow}>
            <button
              className={styles.refundCancelButton}
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              취소
            </button>
            <button
              className={styles.refundSubmitButton}
              disabled={submitDisabled}
              type="submit"
            >
              {isSubmitting ? "신청 중..." : "환불 신청"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function matchesCashHistoryTab(
  transaction: MyPageCashTransaction,
  tab: CashHistoryTab,
) {
  if (tab === "all") {
    return true;
  }

  if (tab === "charge") {
    return transaction.type === "charge";
  }

  if (tab === "refund") {
    return (
      transaction.type === "match_refund" ||
      transaction.type === "charge_refund" ||
      transaction.type === "refund_hold" ||
      transaction.type === "refund_release"
    );
  }

  return transaction.type === "match_debit";
}

function getCashHistoryEmptyTitle(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "아직 완료된 충전 내역이 없습니다.";
    case "refund":
      return "아직 반영된 환불 내역이 없습니다.";
    case "usage":
      return "아직 반영된 사용 내역이 없습니다.";
    case "all":
    default:
      return "아직 반영된 캐시 거래가 없습니다.";
  }
}

function getCashHistoryEmptyDescription(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "캐시를 충전하면 이 탭에서 완료된 적립 내역을 바로 확인할 수 있습니다.";
    case "refund":
      return "매치 환급, 충전 환불, 환불되지 않은 캐시 반환 내역을 이 탭에서 확인할 수 있습니다.";
    case "usage":
      return "매치 신청으로 캐시가 차감되면 이 탭에 사용 내역이 추가됩니다.";
    case "all":
    default:
      return "충전, 신청 차감, 환급이 발생하면 이 영역에서 바로 확인할 수 있습니다.";
  }
}
