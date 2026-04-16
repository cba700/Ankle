"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./cash-charge-result-page.module.css";

type CashChargeFailPageProps = {
  code: string | null;
  message: string | null;
  orderId: string | null;
  redirectPath: string;
};

export function CashChargeFailPage({
  code,
  message,
  orderId,
  redirectPath,
}: CashChargeFailPageProps) {
  const router = useRouter();
  const startedRef = useRef(false);
  const shouldHideFailureUi =
    code === "PAY_PROCESS_CANCELED" || code === "PAYMENT_WINDOW_OPEN_FAILED";

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    const syncFailure = orderId
      ? fetch("/api/payments/toss/fail", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          keepalive: true,
          body: JSON.stringify({
            code,
            message,
            orderId,
            source: "redirect_fail",
          }),
        }).catch(() => null)
      : Promise.resolve(null);

    if (shouldHideFailureUi) {
      void syncFailure;
      router.replace(redirectPath);
    }
  }, [code, message, orderId, redirectPath, router, shouldHideFailureUi]);

  if (shouldHideFailureUi) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className="pageShell">
        <main className={styles.main}>
          <AppLink className={styles.backLink} href={redirectPath}>
            <ArrowLeftIcon />
            충전 화면으로 돌아가기
          </AppLink>

          <section className={styles.card}>
            <span className={`${styles.statusPill} ${styles.statusFailure}`}>
              충전 실패
            </span>
            <h1 className={styles.title}>결제가 완료되지 않았어요.</h1>
            <p className={styles.description}>
              {getFailMessage(code)}
            </p>

            <div className={styles.actionRow}>
              <AppLink className={styles.primaryLink} href={redirectPath}>
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

function getFailMessage(code: string | null) {
  return "결제 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}
