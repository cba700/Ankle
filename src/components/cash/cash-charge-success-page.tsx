"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./cash-charge-result-page.module.css";

type CashChargeSuccessPageProps = {
  amount: string | null;
  nextPath: string | null;
  orderId: string | null;
  paymentKey: string | null;
};

type ConfirmResponse = {
  chargedAmount?: number;
  message?: string;
  ok?: boolean;
  remainingCash?: number;
};

export function CashChargeSuccessPage({
  amount,
  nextPath,
  orderId,
  paymentKey,
}: CashChargeSuccessPageProps) {
  const startedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResponse | null>(null);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    if (!amount || !orderId || !paymentKey) {
      setErrorMessage("결제 승인에 필요한 정보가 없어 충전을 완료할 수 없습니다.");
      return;
    }

    void confirmCharge({ amount, orderId, paymentKey })
      .then((payload) => {
        if (!payload.ok) {
          setErrorMessage(payload.message ?? "캐시 적립 확인에 실패했습니다.");
          return;
        }

        setResult(payload);
      })
      .catch(() => {
        setErrorMessage("결제 승인 확인 중 오류가 발생했습니다. 잠시 후 다시 확인해 주세요.");
      });
  }, [amount, orderId, paymentKey]);

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <AppLink className={styles.backLink} href="/cash/charge">
            <ArrowLeftIcon />
            충전 화면으로 돌아가기
          </AppLink>

          {!result && !errorMessage ? (
            <section className={styles.card}>
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <span
                  className={`${styles.statusPill} ${styles.statusPending} ${styles.statusPillCentered}`}
                >
                  충전 확인 중
                </span>
                <h1 className={styles.title}>결제를 확인하고 있어요.</h1>
                <p className={styles.description}>잠시만 기다려 주세요.</p>
              </div>
            </section>
          ) : null}

          {result ? (
            <section className={styles.card}>
              <span className={`${styles.statusPill} ${styles.statusSuccess}`}>
                충전 완료
              </span>
              <h1 className={styles.title}>캐시가 충전됐어요.</h1>
              <p className={styles.description}>
                잔액 반영까지 끝났습니다. 바로 사용할 수 있어요.
              </p>

              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>적립 금액</span>
                  <strong className={styles.summaryValue}>
                    {formatMoneyLabel(result.chargedAmount ?? Number(amount))}
                  </strong>
                </div>
                <div className={styles.summaryCard}>
                  <span className={styles.summaryLabel}>현재 캐시</span>
                  <strong className={styles.summaryValue}>
                    {formatMoneyLabel(result.remainingCash)}
                  </strong>
                </div>
              </div>

              <div className={styles.actionRow}>
                <AppLink className={styles.primaryLink} href={nextPath || "/mypage"}>
                  {nextPath ? "신청 화면으로 돌아가기" : "마이페이지로 이동"}
                </AppLink>
                <AppLink className={styles.secondaryLink} href="/cash/charge">
                  추가 충전하기
                </AppLink>
              </div>
            </section>
          ) : null}

          {errorMessage ? (
            <section className={styles.card}>
              <span className={`${styles.statusPill} ${styles.statusFailure}`}>
                확인 필요
              </span>
              <h1 className={styles.title}>충전 상태를 바로 확인하지 못했어요.</h1>
              <p className={styles.description}>{errorMessage}</p>

              <div className={styles.actionRow}>
                <AppLink className={styles.primaryLink} href={nextPath || "/mypage"}>
                  {nextPath ? "신청 화면으로 돌아가기" : "마이페이지로 이동"}
                </AppLink>
                <AppLink className={styles.secondaryLink} href="/cash/charge">
                  다시 시도하기
                </AppLink>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <LegalFooter />
    </div>
  );
}

async function confirmCharge({
  amount,
  orderId,
  paymentKey,
}: {
  amount: string;
  orderId: string;
  paymentKey: string;
}) {
  const parsedAmount = Number.parseInt(amount, 10);

  if (!Number.isFinite(parsedAmount)) {
    return {
      message: "결제 금액 정보가 올바르지 않습니다.",
      ok: false,
    } satisfies ConfirmResponse;
  }

  const response = await fetch("/api/payments/toss/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: parsedAmount,
      orderId,
      paymentKey,
    }),
  });

  return (await response.json().catch(() => null)) as ConfirmResponse;
}

function formatMoneyLabel(amount?: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "확인 불가";
  }

  return `${new Intl.NumberFormat("ko-KR").format(amount)}원`;
}
