"use client";

import { useState } from "react";
import { ArrowLeftIcon, ClockIcon, WalletIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
import {
  buildCashChargePackageLabel,
  type CashChargePackage,
  CASH_CHARGE_PACKAGES,
} from "@/lib/payments/toss";
import styles from "./cash-charge-page.module.css";

type ChargeOrderSummary = {
  amountLabel: string;
  metaLabel: string;
  orderId: string;
  statusLabel: string;
  statusTone: "accent" | "danger" | "neutral";
};

type CashChargePageProps = {
  accountLabel: string;
  cashBalanceLabel: string;
  customerKey: string;
  displayName: string;
  nextPath: string | null;
  recentOrders: ChargeOrderSummary[];
};

type ChargeOrderResponse = {
  amount: number;
  code?: string;
  orderId: string;
  orderName: string;
};

type TossPaymentsFactory = (clientKey: string) => {
  payment: (params: { customerKey: string }) => {
    requestPayment: (params: {
      amount: number;
      customerEmail?: string;
      customerName?: string;
      failUrl: string;
      method: "CARD";
      orderId: string;
      orderName: string;
      successUrl: string;
    }) => Promise<void> | void;
  };
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

let tossPaymentsPromise: Promise<TossPaymentsFactory> | null = null;

export function CashChargePage({
  accountLabel,
  cashBalanceLabel,
  customerKey,
  displayName,
  nextPath,
  recentOrders,
}: CashChargePageProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<CashChargePackage>(10000);

  const canSubmit = !isSubmitting;

  async function handleCharge() {
    if (!canSubmit) {
      return;
    }

    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!tossClientKey) {
      setFeedbackMessage("토스 결제 키가 설정되지 않아 충전을 시작할 수 없습니다.");
      return;
    }

    setFeedbackMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/cash/charge-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: selectedAmount,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ChargeOrderResponse | null;

      if (!response.ok || !payload) {
        setFeedbackMessage(getChargeErrorMessage(payload?.code));
        return;
      }

      const TossPayments = await loadTossPayments();
      const payment = TossPayments(tossClientKey).payment({
        customerKey,
      });
      const origin = window.location.origin;
      const successUrl = new URL("/cash/charge/success", origin);
      const failUrl = new URL("/cash/charge/fail", origin);

      if (nextPath) {
        successUrl.searchParams.set("next", nextPath);
        failUrl.searchParams.set("next", nextPath);
      }

      await payment.requestPayment({
        amount: payload.amount,
        customerEmail: accountLabel.includes("@") ? accountLabel : undefined,
        customerName: displayName,
        failUrl: failUrl.toString(),
        method: "CARD",
        orderId: payload.orderId,
        orderName: payload.orderName,
        successUrl: successUrl.toString(),
      });
    } catch (error) {
      setFeedbackMessage(getSdkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <AppLink className={styles.backLink} href="/mypage">
            <ArrowLeftIcon />
            마이페이지로 돌아가기
          </AppLink>

          <section className={styles.heroCard}>
            <p className={styles.eyebrow}>Cash Charge</p>
            <div className={styles.heroTop}>
              <div>
                <div className={`${styles.statusPill} ${styles.statusAccent}`}>
                  토스페이먼츠 충전
                </div>
                <h1 className={styles.title}>캐시를 충전하고 바로 신청하세요.</h1>
                <p className={styles.subTitle}>
                  충전된 캐시는 매치 신청 시 자동 차감되고, 취소 정책에 따라 캐시로 환급됩니다.
                </p>
              </div>

              <div className={styles.balance}>
                <span className={styles.balanceLabel}>현재 보유 캐시</span>
                <strong className={styles.balanceValue}>{cashBalanceLabel}</strong>
              </div>
            </div>

            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <WalletIcon />
                {accountLabel}
              </span>
              <span className={styles.metaItem}>
                <ClockIcon />
                충전 후 즉시 잔액 반영
              </span>
            </div>
          </section>

          <div className={styles.contentGrid}>
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>충전 금액 선택</h2>
              <p className={styles.sectionDescription}>
                초기 운영에서는 고정 패키지로만 충전할 수 있습니다.
              </p>

              <div className={styles.packageGrid}>
                {CASH_CHARGE_PACKAGES.map((amount) => {
                  const isActive = selectedAmount === amount;

                  return (
                    <button
                      className={`${styles.packageButton} ${
                        isActive ? styles.packageButtonActive : ""
                      }`}
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      type="button"
                    >
                      {amount === 10000 ? (
                        <span className={styles.packageBadge}>추천 패키지</span>
                      ) : null}
                      <strong className={styles.packageAmount}>
                        {buildCashChargePackageLabel(amount)}
                      </strong>
                      <span className={styles.packageSummary}>
                        {amount === 5000
                          ? "첫 신청 전 가볍게 시작하는 기본 충전"
                          : amount === 10000
                            ? "가장 많이 쓰는 기본 운영 패키지"
                            : "여러 매치를 이어서 신청할 때 적합한 충전"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>충전 전 안내</h2>
              <p className={styles.sectionDescription}>
                실제 운영에 맞춰 결제 승인과 캐시 적립은 서버에서 검증합니다.
              </p>

              <div className={styles.infoBox}>
                <span className={styles.metaLabel}>현재 충전 계정</span>
                <strong>{accountLabel}</strong>
              </div>

              <div className={styles.policyBox}>
                <strong>운영 정책</strong>
                <ul className={styles.policyList}>
                  <li className={styles.policyItem}>
                    <span>충전 수단</span>
                    <strong>토스페이먼츠 결제창</strong>
                  </li>
                  <li className={styles.policyItem}>
                    <span>신청 방식</span>
                    <strong>캐시 차감 후 확정</strong>
                  </li>
                  <li className={styles.policyItem}>
                    <span>충전 환불</span>
                    <strong>관리자 검토 후 처리</strong>
                  </li>
                </ul>
              </div>

              <div className={styles.infoBox}>
                <span className={styles.metaLabel}>유의사항</span>
                <p className={styles.sectionDescription}>
                  성공 페이지에 도착한 뒤 서버 승인까지 끝나야 캐시가 최종 적립됩니다. 창을 닫았더라도
                  주문 내역은 운영 화면에서 복구할 수 있게 기록됩니다.
                </p>
              </div>
            </section>
          </div>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>최근 충전 주문</h2>
            <p className={styles.sectionDescription}>
              최근 시도한 충전 주문 상태를 여기서 확인할 수 있습니다.
            </p>

            {recentOrders.length === 0 ? (
              <p className={styles.emptyText}>아직 생성된 충전 주문이 없습니다.</p>
            ) : (
              <div className={styles.orderList}>
                {recentOrders.map((order) => (
                  <article className={styles.orderItem} key={order.orderId}>
                    <div>
                      <div className={styles.orderTitle}>{order.amountLabel}</div>
                      <p className={styles.orderMeta}>
                        {order.metaLabel}
                        <br />
                        주문번호 {order.orderId}
                      </p>
                    </div>
                    <span
                      className={`${styles.statusPill} ${
                        order.statusTone === "danger"
                          ? styles.statusDanger
                          : order.statusTone === "accent"
                            ? styles.statusAccent
                            : styles.statusNeutral
                      }`}
                    >
                      {order.statusLabel}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <div className={styles.actionWrap}>
        <div className={styles.actionBar}>
          <div className={styles.actionCopy}>
            <strong>{buildCashChargePackageLabel(selectedAmount)} 충전</strong>
            <p>
              결제 인증 후 서버 승인까지 완료되면 캐시 잔액에 바로 반영됩니다.
            </p>
            {feedbackMessage ? <p className={styles.feedbackText}>{feedbackMessage}</p> : null}
          </div>

          <button
            className={styles.primaryButton}
            disabled={!canSubmit}
            onClick={handleCharge}
            type="button"
          >
            {isSubmitting ? "결제창 준비 중..." : "토스로 충전하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getChargeErrorMessage(code?: string) {
  switch (code) {
    case "AUTH_REQUIRED":
      return "로그인이 필요한 기능입니다.";
    case "INVALID_CHARGE_AMOUNT":
      return "허용되지 않은 충전 금액입니다.";
    case "TOSS_NOT_CONFIGURED":
      return "토스 결제 설정이 완료되지 않았습니다.";
    default:
      return "충전 주문을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

function getSdkErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return `결제창을 열지 못했습니다. ${error.message}`;
  }

  return "결제창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function loadTossPayments() {
  if (window.TossPayments) {
    return Promise.resolve(window.TossPayments);
  }

  if (tossPaymentsPromise) {
    return tossPaymentsPromise;
  }

  tossPaymentsPromise = new Promise<TossPaymentsFactory>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-toss-payments="true"]',
    );

    if (existingScript && window.TossPayments) {
      resolve(window.TossPayments);
      return;
    }

    const script = existingScript ?? document.createElement("script");

    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.dataset.tossPayments = "true";
    script.onload = () => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
        return;
      }

      reject(new Error("TossPayments SDK failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load TossPayments SDK"));

    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  return tossPaymentsPromise;
}
