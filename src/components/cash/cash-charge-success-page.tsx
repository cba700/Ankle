"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./cash-charge-page.module.css";

type CashChargeSuccessPageProps = {
  amount: string | null;
  nextPath: string | null;
  orderId: string | null;
  paymentKey: string | null;
};

type ConfirmResponse = {
  chargedAmount?: number;
  code?: string;
  message?: string;
  method?: string | null;
  ok?: boolean;
  orderId?: string;
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
            <section className={styles.resultCard}>
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <strong>결제 승인과 캐시 적립을 확인하는 중입니다.</strong>
                <p className={styles.sectionDescription}>
                  승인 결과를 서버에서 다시 검증하고 있습니다. 페이지를 닫지 말고 잠시만 기다려
                  주세요.
                </p>
              </div>
            </section>
          ) : null}

          {result ? (
            <section className={styles.resultCard}>
              <p className={styles.eyebrow}>Charge Success</p>
              <div className={styles.resultTop}>
                <div>
                  <div className={`${styles.resultBadge} ${styles.resultSuccess}`}>
                    충전 완료
                  </div>
                  <h1 className={styles.title}>캐시가 정상적으로 적립되었습니다.</h1>
                  <p className={styles.resultDescription}>
                    주문 승인과 잔액 반영까지 모두 끝났습니다. 이제 매치 신청 시 바로 사용할 수
                    있습니다.
                  </p>
                </div>
                <div className={styles.balance}>
                  <span className={styles.balanceLabel}>현재 캐시</span>
                  <strong className={styles.resultValue}>
                    {formatMoneyLabel(result.remainingCash)}
                  </strong>
                </div>
              </div>

              <ul className={styles.resultList}>
                <li className={styles.resultItem}>
                  <span>주문번호</span>
                  <strong>{result.orderId ?? orderId}</strong>
                </li>
                <li className={styles.resultItem}>
                  <span>충전 금액</span>
                  <strong>{formatMoneyLabel(result.chargedAmount ?? Number(amount))}</strong>
                </li>
                <li className={styles.resultItem}>
                  <span>결제수단</span>
                  <strong>{result.method ?? "토스 결제창"}</strong>
                </li>
              </ul>

              <div className={styles.resultActions}>
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
            <section className={styles.resultCard}>
              <p className={styles.eyebrow}>Charge Review</p>
              <div className={styles.resultTop}>
                <div>
                  <div className={`${styles.resultBadge} ${styles.resultFailure}`}>
                    확인 필요
                  </div>
                  <h1 className={styles.title}>충전 결과를 자동 확정하지 못했습니다.</h1>
                  <p className={styles.resultDescription}>{errorMessage}</p>
                </div>
              </div>

              <ul className={styles.resultList}>
                <li className={styles.resultItem}>
                  <span>주문번호</span>
                  <strong>{orderId ?? "확인 불가"}</strong>
                </li>
                <li className={styles.resultItem}>
                  <span>결제 인증 금액</span>
                  <strong>{amount ? formatMoneyLabel(Number(amount)) : "확인 불가"}</strong>
                </li>
              </ul>

              <div className={styles.resultActions}>
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
