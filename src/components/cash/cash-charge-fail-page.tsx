"use client";

import { useEffect, useRef } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./cash-charge-result-page.module.css";

type CashChargeFailPageProps = {
  code: string | null;
  message: string | null;
  orderId: string | null;
};

export function CashChargeFailPage({
  code,
  message,
  orderId,
}: CashChargeFailPageProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !orderId) {
      return;
    }

    startedRef.current = true;

    void fetch("/api/payments/toss/fail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        message,
        orderId,
      }),
    }).catch(() => null);
  }, [code, message, orderId]);

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <AppLink className={styles.backLink} href="/cash/charge">
            <ArrowLeftIcon />
            충전 화면으로 돌아가기
          </AppLink>

          <section className={styles.card}>
            <span className={`${styles.statusPill} ${styles.statusFailure}`}>
              충전 실패
            </span>
            <h1 className={styles.title}>결제가 완료되지 않았어요.</h1>
            <p className={styles.description}>
              {getFailMessage(message, code)}
            </p>

            <div className={styles.actionRow}>
              <AppLink className={styles.primaryLink} href="/cash/charge">
                다시 충전하기
              </AppLink>
              <AppLink className={styles.secondaryLink} href="/mypage">
                마이페이지로 이동
              </AppLink>
            </div>
          </section>
        </main>
      </div>

      <LegalFooter />
    </div>
  );
}

function getFailMessage(message: string | null, code: string | null) {
  const trimmedMessage = message?.trim();

  if (trimmedMessage) {
    return trimmedMessage;
  }

  if (code === "PAY_PROCESS_CANCELED") {
    return "결제가 취소되었습니다. 다시 시도해 주세요.";
  }

  return "결제 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
