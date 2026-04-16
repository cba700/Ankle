"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { MyPageCashTransaction } from "@/lib/mypage";
import { BrandLogo } from "@/components/branding/brand-logo";
import {
  CASH_REFUND_BANK_OPTIONS,
  isValidCashRefundAccountHolder,
  isValidCashRefundAccountNumber,
  normalizeCashRefundAccountHolder,
  normalizeCashRefundAccountNumber,
} from "@/lib/cash-refunds";
import {
  CASH_REFUND_CUTOFF_NOTICE,
  CASH_REFUND_ELIGIBILITY_NOTICE,
  CASH_REFUND_HOLIDAY_NOTICE,
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
  accountHolder: string;
  accountNumberLabel: string;
  createdAtLabel: string;
  requestedAmountLabel: string;
};

type MyPageCashProps = {
  cashBalanceAmount: number;
  cashBalanceLabel: string;
  cashTransactions: MyPageCashTransaction[];
  displayName: string;
  initialIsAdmin: boolean;
  pendingRefundRequest: PendingCashRefundRequest | null;
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
  { id: "usage", label: "참가" },
  { id: "refund", label: "환급" },
];

export function MyPageCash({
  cashBalanceAmount,
  cashBalanceLabel,
  cashTransactions,
  displayName,
  initialIsAdmin,
  pendingRefundRequest,
}: MyPageCashProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CashHistoryTab>("all");
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedBankName, setSelectedBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState(displayName);
  const [agreedToSchedule, setAgreedToSchedule] = useState(false);
  const [refundErrorMessage, setRefundErrorMessage] = useState<string | null>(null);
  const [isSubmittingRefundRequest, setIsSubmittingRefundRequest] = useState(false);
  const filteredTransactions = useMemo(
    () => cashTransactions.filter((transaction) => matchesCashHistoryTab(transaction, activeTab)),
    [activeTab, cashTransactions],
  );
  const canOpenRefundRequest = !pendingRefundRequest && cashBalanceAmount > 0;
  const canSubmitRefundRequest =
    !isSubmittingRefundRequest &&
    canOpenRefundRequest &&
    selectedBankName.length > 0 &&
    isValidCashRefundAccountNumber(accountNumber) &&
    isValidCashRefundAccountHolder(accountHolder) &&
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
          accountHolder,
          accountNumber,
          agreedToSchedule,
          bankName: selectedBankName,
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

      resetRefundForm(displayName);
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

  function resetRefundForm(nextDisplayName: string) {
    setSelectedBankName("");
    setAccountNumber("");
    setAccountHolder(nextDisplayName);
    setAgreedToSchedule(false);
    setRefundErrorMessage(null);
  }

  const refundButtonLabel = pendingRefundRequest
    ? "처리 대기 중"
    : cashBalanceAmount > 0
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
              캐시 상태
            </span>
            <p className={styles.heroEyebrow}>사용 가능 금액</p>
            <h1 className={styles.heroTitle}>{cashBalanceLabel}</h1>
            <p className={styles.heroDescription}>지금 바로 매치 참가와 환급에 사용할 수 있어요.</p>
          </div>

          <div className={styles.heroActions}>
            <AppLink className={styles.primaryButton} href="/cash/charge">
              충전하기
            </AppLink>
            <button
              className={styles.secondaryButton}
              disabled={!canOpenRefundRequest}
              onClick={handleOpenRefundRequest}
              type="button"
            >
              {refundButtonLabel}
            </button>
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
                <span className={styles.requestSummaryLabel}>신청 계좌</span>
                <strong className={styles.requestSummaryValue}>
                  {pendingRefundRequest.accountNumberLabel}
                </strong>
              </div>
              <div className={styles.requestSummaryRow}>
                <span className={styles.requestSummaryLabel}>예금주</span>
                <strong className={styles.requestSummaryValue}>
                  {pendingRefundRequest.accountHolder}
                </strong>
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
              <p className={baseStyles.sectionEyebrow}>사용자의 활동 기준</p>
              <h2 className={baseStyles.sectionTitle}>캐시 활동 내역</h2>
            </div>
            <span className={baseStyles.sectionCount}>{filteredTransactions.length}건</span>
          </div>

          <p className={styles.sectionDescription}>{getCashHistoryDescription(activeTab)}</p>

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
            <div className={styles.activityList}>
              {filteredTransactions.map((transaction) => (
                <article className={styles.activityCard} key={transaction.id}>
                  <div className={styles.activityContent}>
                    <div className={styles.activityCopy}>
                      <div className={styles.activityHeader}>
                        <strong className={styles.activityTitle}>{transaction.title}</strong>
                        <span
                          className={`${styles.activityState} ${
                            transaction.tone === "danger"
                              ? styles.activityStateDanger
                              : transaction.tone === "muted"
                                ? styles.activityStateMuted
                                : styles.activityStateAccent
                          }`}
                        >
                          {getCashTransactionStateLabel(transaction)}
                        </span>
                      </div>
                      <p className={styles.activityMeta}>{transaction.metaLabel}</p>
                      <p className={styles.activityBalance}>{transaction.balanceLabel}</p>
                    </div>

                    <span
                      className={`${styles.activityAmount} ${
                        transaction.tone === "danger"
                          ? styles.activityAmountDanger
                          : transaction.tone === "muted"
                            ? styles.activityAmountMuted
                            : styles.activityAmountAccent
                      }`}
                    >
                      {transaction.amountLabel}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {isRefundModalOpen ? (
        <CashRefundRequestDialog
          accountHolder={accountHolder}
          accountNumber={accountNumber}
          bankName={selectedBankName}
          errorMessage={refundErrorMessage}
          isSubmitting={isSubmittingRefundRequest}
          onAccountHolderChange={(value) =>
            setAccountHolder(normalizeCashRefundAccountHolder(value))
          }
          onAccountNumberChange={(value) =>
            setAccountNumber(normalizeCashRefundAccountNumber(value))
          }
          onBankNameChange={setSelectedBankName}
          onClose={handleCloseRefundRequest}
          onSubmit={handleSubmitRefundRequest}
          onToggleScheduleAgreement={() => setAgreedToSchedule((current) => !current)}
          requestedAmountLabel={cashBalanceLabel}
          scheduleAgreed={agreedToSchedule}
          submitDisabled={!canSubmitRefundRequest}
        />
      ) : null}

      <LegalFooter />
    </div>
  );
}

function CashRefundRequestDialog({
  accountHolder,
  accountNumber,
  bankName,
  errorMessage,
  isSubmitting,
  onAccountHolderChange,
  onAccountNumberChange,
  onBankNameChange,
  onClose,
  onSubmit,
  onToggleScheduleAgreement,
  requestedAmountLabel,
  scheduleAgreed,
  submitDisabled,
}: {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onAccountHolderChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
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

          <label className={styles.refundField}>
            <span className={styles.refundFieldLabel}>환불 계좌 은행</span>
            <select
              className={styles.refundSelect}
              onChange={(event) => onBankNameChange(event.target.value)}
              value={bankName}
            >
              <option value="">은행을 선택해 주세요</option>
              {CASH_REFUND_BANK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.refundField}>
            <span className={styles.refundFieldLabel}>환불 계좌 번호</span>
            <input
              className={styles.refundInput}
              inputMode="numeric"
              onChange={(event) => onAccountNumberChange(event.target.value)}
              placeholder="숫자만 입력"
              type="text"
              value={accountNumber}
            />
          </label>

          <label className={styles.refundField}>
            <span className={styles.refundFieldLabel}>환불 계좌 예금주</span>
            <input
              className={styles.refundInput}
              onChange={(event) => onAccountHolderChange(event.target.value)}
              placeholder="예금주명 입력"
              type="text"
              value={accountHolder}
            />
          </label>

          <label className={styles.refundCheckboxRow}>
            <input
              checked={scheduleAgreed}
              className={styles.refundCheckbox}
              onChange={onToggleScheduleAgreement}
              type="checkbox"
            />
            <span className={styles.refundCheckboxLabel}>
              {CASH_REFUND_SCHEDULE_NOTICE} {CASH_REFUND_HOLIDAY_NOTICE} {CASH_REFUND_CUTOFF_NOTICE}
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
      transaction.type === "refund_release"
    );
  }

  return transaction.type === "match_debit";
}

function getCashHistoryDescription(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "충전이 완료되어 바로 사용할 수 있게 된 캐시만 보여드려요.";
    case "refund":
      return "참가 취소, 충전 환불, 환불 취소로 다시 돌아온 캐시를 모아 보여드려요.";
    case "usage":
      return "매치 참가로 캐시가 차감된 활동만 보여드려요.";
    case "all":
    default:
      return "최근에 어떤 활동으로 캐시가 늘고 줄었는지 한눈에 확인할 수 있어요.";
  }
}

function getCashHistoryEmptyTitle(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "아직 충전된 캐시가 없습니다.";
    case "refund":
      return "아직 돌아온 캐시가 없습니다.";
    case "usage":
      return "아직 참가로 사용한 캐시가 없습니다.";
    case "all":
    default:
      return "아직 캐시 활동이 없습니다.";
  }
}

function getCashHistoryEmptyDescription(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "캐시를 충전하면 이 탭에서 바로 사용할 수 있는 금액으로 확인할 수 있습니다.";
    case "refund":
      return "참가 취소나 환불 취소가 반영되면 이 탭에서 돌아온 금액을 확인할 수 있습니다.";
    case "usage":
      return "매치에 참가하면 이 탭에 사용한 캐시 활동이 추가됩니다.";
    case "all":
    default:
      return "충전, 참가, 환급이 생기면 이 영역에서 바로 확인할 수 있습니다.";
  }
}

function getCashTransactionStateLabel(transaction: MyPageCashTransaction) {
  switch (transaction.type) {
    case "charge":
      return "충전";
    case "charge_refund":
    case "match_refund":
      return "환급";
    case "refund_hold":
      return "신청";
    case "refund_release":
      return "복구";
    case "adjustment":
      return "조정";
    case "match_debit":
    default:
      return "차감";
  }
}
