"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
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
  amount: number | string;
  code?: string;
  orderId: string;
  orderName: string;
};

type TossPaymentAmount = {
  currency: "KRW";
  value: number;
};

type ChargePaymentMethod = "CARD" | "TRANSFER" | "KAKAOPAY" | "NAVERPAY" | "TOSSPAY";

type TossRequestPaymentBaseParams = {
  amount: TossPaymentAmount;
  customerEmail?: string;
  customerName?: string;
  failUrl: string;
  orderId: string;
  orderName: string;
  successUrl: string;
};

type TossTransferPaymentParams = TossRequestPaymentBaseParams & {
  method: "TRANSFER";
};

type TossCardPaymentParams = TossRequestPaymentBaseParams & {
  method: "CARD";
  card?: {
    flowMode?: "DEFAULT" | "DIRECT";
    easyPay?: "KAKAOPAY" | "NAVERPAY" | "TOSSPAY";
  };
};

type TossRequestPaymentParams = TossTransferPaymentParams | TossCardPaymentParams;

type TossPaymentsFactory = (clientKey: string) => {
  payment: (params: { customerKey: string }) => {
    requestPayment: (params: TossRequestPaymentParams) => Promise<void> | void;
  };
};

const PAYMENT_METHODS: Array<{
  description: string;
  key: ChargePaymentMethod;
  label: string;
}> = [
  {
    description: "은행 계좌로 바로 결제",
    key: "TRANSFER",
    label: "계좌이체",
  },
  {
    description: "카카오페이로 결제",
    key: "KAKAOPAY",
    label: "카카오페이",
  },
  {
    description: "네이버페이로 결제",
    key: "NAVERPAY",
    label: "네이버페이",
  },
  {
    description: "토스페이로 결제",
    key: "TOSSPAY",
    label: "토스페이",
  },
  {
    description: "일반 카드 결제",
    key: "CARD",
    label: "카드",
  },
];

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

let tossPaymentsPromise: Promise<TossPaymentsFactory> | null = null;

export function CashChargePage({
  accountLabel,
  customerKey,
  displayName,
  nextPath,
}: CashChargePageProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<CashChargePackage>(10000);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<ChargePaymentMethod>("CARD");

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

      const chargeAmount =
        typeof payload.amount === "number"
          ? payload.amount
          : Number.parseInt(payload.amount, 10);

      if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
        setFeedbackMessage("충전 금액 정보를 확인하지 못해 결제를 시작할 수 없습니다.");
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

      const requestPaymentParams = buildRequestPaymentParams({
        amount: {
          currency: "KRW",
          value: chargeAmount,
        },
        customerEmail: accountLabel.includes("@") ? accountLabel : undefined,
        customerName: displayName,
        failUrl: failUrl.toString(),
        orderId: payload.orderId,
        orderName: payload.orderName,
        successUrl: successUrl.toString(),
      }, selectedPaymentMethod);

      await payment.requestPayment(requestPaymentParams);
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

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>충전 금액 선택</h2>

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
                    <strong className={styles.packageAmount}>
                      {buildCashChargePackageLabel(amount)}
                    </strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>결제 방법</h2>

            <div className={styles.paymentMethodGrid}>
              {PAYMENT_METHODS.map((method) => {
                const isActive = selectedPaymentMethod === method.key;

                return (
                  <button
                    className={`${styles.paymentMethodButton} ${
                      isActive ? styles.paymentMethodButtonActive : ""
                    }`}
                    key={method.key}
                    onClick={() => setSelectedPaymentMethod(method.key)}
                    type="button"
                  >
                    <strong className={styles.paymentMethodLabel}>{method.label}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      <div className={styles.actionWrap}>
        <div className={styles.actionBar}>
          <div className={styles.actionCopy}>
            <strong>{buildCashChargePackageLabel(selectedAmount)} 충전</strong>
            {feedbackMessage ? <p className={styles.feedbackText}>{feedbackMessage}</p> : null}
          </div>

          <button
            className={styles.primaryButton}
            disabled={!canSubmit}
            onClick={handleCharge}
            type="button"
          >
            {isSubmitting ? "결제창 준비 중..." : "충전하기"}
          </button>
        </div>
      </div>

      <LegalFooter />
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

function buildRequestPaymentParams(
  baseParams: TossRequestPaymentBaseParams,
  paymentMethod: ChargePaymentMethod,
): TossRequestPaymentParams {
  if (paymentMethod === "TRANSFER") {
    return {
      ...baseParams,
      method: "TRANSFER",
    };
  }

  if (paymentMethod === "CARD") {
    return {
      ...baseParams,
      method: "CARD",
    };
  }

  return {
    ...baseParams,
    card: {
      easyPay: paymentMethod,
      flowMode: "DIRECT",
    },
    method: "CARD",
  };
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
