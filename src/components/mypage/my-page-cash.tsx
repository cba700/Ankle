"use client";

import { useMemo, useState } from "react";
import type { MyPageCashTransaction } from "@/lib/mypage";
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

type MyPageCashProps = {
  cashBalanceLabel: string;
  cashTransactions: MyPageCashTransaction[];
  initialIsAdmin: boolean;
};

type CashHistoryTab = "all" | "charge" | "refund" | "usage";

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
}: MyPageCashProps) {
  const [activeTab, setActiveTab] = useState<CashHistoryTab>("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const filteredTransactions = useMemo(
    () => cashTransactions.filter((transaction) => matchesCashHistoryTab(transaction, activeTab)),
    [activeTab, cashTransactions],
  );

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <span className={baseStyles.brandWord}>앵클</span>
            <span className={baseStyles.brandDot}>.</span>
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
            <p className={styles.heroDescription}>
              충전, 매치 신청 차감, 환급처럼 실제 잔액이 움직인 최근 거래만 필터별로 확인할 수
              있습니다.
            </p>
          </div>

          <div className={styles.heroActions}>
            <button
              className={styles.secondaryButton}
              onClick={() =>
                setFeedbackMessage("충전 환불은 현재 운영 문의로만 처리됩니다.")
              }
              type="button"
            >
              캐시 환불
            </button>
            <AppLink className={styles.primaryButton} href="/cash/charge">
              충전하기
            </AppLink>
          </div>
        </section>

        {feedbackMessage ? (
          <div className={styles.feedbackBox}>
            <strong>운영 안내</strong>
            <p>{feedbackMessage}</p>
          </div>
        ) : null}

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>실제 캐시 거래 기준</p>
              <h2 className={baseStyles.sectionTitle}>캐시 상세 내역</h2>
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

      <LegalFooter />
    </div>
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
      transaction.type === "charge_refund"
    );
  }

  return transaction.type === "match_debit";
}

function getCashHistoryDescription(tab: CashHistoryTab) {
  switch (tab) {
    case "charge":
      return "토스 결제 승인 후 실제로 적립된 충전 거래만 보여줍니다.";
    case "refund":
      return "매치 환급과 충전 환불처럼 잔액이 다시 늘어난 거래만 모아 보여줍니다.";
    case "usage":
      return "매치 신청으로 캐시가 차감된 거래만 표시합니다. 환급된 건은 환불 탭에서 확인하세요.";
    case "all":
    default:
      return "운영 보정을 포함해 실제 잔액이 움직인 최근 거래를 모두 보여줍니다.";
  }
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
      return "매치 취소 환급이나 충전 환불이 반영되면 이 탭에서 확인할 수 있습니다.";
    case "usage":
      return "매치 신청으로 캐시가 차감되면 이 탭에 사용 내역이 추가됩니다.";
    case "all":
    default:
      return "충전, 신청 차감, 환급이 발생하면 이 영역에서 바로 확인할 수 있습니다.";
  }
}
