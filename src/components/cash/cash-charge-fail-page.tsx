"use client";

import { useEffect, useRef } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./cash-charge-page.module.css";

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

          <section className={styles.resultCard}>
            <p className={styles.eyebrow}>Charge Failed</p>
            <div className={styles.resultTop}>
              <div>
                <div className={`${styles.resultBadge} ${styles.resultFailure}`}>
                  충전 실패
                </div>
                <h1 className={styles.title}>결제가 완료되지 않았습니다.</h1>
                <p className={styles.resultDescription}>
                  {message?.trim()
                    ? message
                    : "결제 과정이 중단되었거나 승인 전에 실패했습니다. 내용을 확인한 뒤 다시 시도해 주세요."}
                </p>
              </div>
            </div>

            <ul className={styles.resultList}>
              <li className={styles.resultItem}>
                <span>에러 코드</span>
                <strong>{code ?? "확인 불가"}</strong>
              </li>
              <li className={styles.resultItem}>
                <span>주문번호</span>
                <strong>{orderId ?? "미전달"}</strong>
              </li>
            </ul>

            <div className={styles.resultActions}>
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
