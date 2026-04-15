"use client";

import { useState, useTransition } from "react";
import styles from "./login-page.module.css";

type PhoneVerificationSuccess = {
  maskedPhoneNumber: string;
  phoneNumberE164: string;
  verifiedAt: string;
};

type PhoneVerificationFormProps = {
  purpose: "activation" | "signup";
  onVerified: (result: PhoneVerificationSuccess) => void;
};

export function PhoneVerificationForm({
  onVerified,
  purpose,
}: PhoneVerificationFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handlePhoneNumberChange(nextPhoneNumber: string) {
    setPhoneNumber(nextPhoneNumber);
    setErrorMessage(null);

    if (isVerified || requestId) {
      setRequestId(null);
      setIsVerified(false);
      setVerificationCode("");
      setFeedback(null);
    }
  }

  function handleSendVerification() {
    startTransition(async () => {
      setErrorMessage(null);
      setFeedback(null);

      const response = await fetch("/api/auth/phone-verifications/send", {
        body: JSON.stringify({
          phoneNumber,
          purpose,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            requestId?: string;
            retryAfterSeconds?: number | null;
          }
        | null;

      if (!response.ok || !payload?.requestId) {
        setErrorMessage(
          payload?.message ?? "인증번호를 보내지 못했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      setRequestId(payload.requestId);
      setVerificationCode("");
      setFeedback(
        payload.retryAfterSeconds
          ? `인증번호를 보냈습니다. 재요청은 ${payload.retryAfterSeconds}초 후 가능합니다.`
          : "인증번호를 보냈습니다.",
      );
    });
  }

  function handleVerifyCode() {
    if (!requestId) {
      setErrorMessage("먼저 인증번호를 요청해 주세요.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      setFeedback(null);

      const response = await fetch("/api/auth/phone-verifications/verify", {
        body: JSON.stringify({
          code: verificationCode,
          phoneNumber,
          purpose,
          requestId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            maskedPhoneNumber?: string;
            message?: string;
            ok?: boolean;
            phoneNumberE164?: string;
            verifiedAt?: string;
          }
        | null;

      if (
        !response.ok ||
        !payload?.ok ||
        !payload.phoneNumberE164 ||
        !payload.verifiedAt ||
        !payload.maskedPhoneNumber
      ) {
        setErrorMessage(
          payload?.message ?? "인증번호 확인에 실패했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      setIsVerified(true);
      setFeedback(`휴대폰 인증이 완료되었습니다. (${payload.maskedPhoneNumber})`);
      onVerified({
        maskedPhoneNumber: payload.maskedPhoneNumber,
        phoneNumberE164: payload.phoneNumberE164,
        verifiedAt: payload.verifiedAt,
      });
    });
  }

  return (
    <div className={styles.verificationSection}>
      <label className={styles.field}>
        <span className={styles.fieldLabel}>휴대폰 번호</span>
        <div className={styles.inlineFieldRow}>
          <input
            autoComplete="tel-national"
            className={styles.textField}
            disabled={isPending || isVerified}
            inputMode="tel"
            onChange={(event) => handlePhoneNumberChange(event.target.value)}
            placeholder="01012345678"
            type="tel"
            value={phoneNumber}
          />
          <button
            className={styles.inlineButton}
            disabled={isPending || isVerified || phoneNumber.trim().length === 0}
            onClick={handleSendVerification}
            type="button"
          >
            {requestId ? "재요청" : "인증번호"}
          </button>
        </div>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>인증번호</span>
        <div className={styles.inlineFieldRow}>
          <input
            className={styles.textField}
            disabled={isPending || !requestId || isVerified}
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setVerificationCode(event.target.value)}
            placeholder="6자리 숫자"
            type="text"
            value={verificationCode}
          />
          <button
            className={styles.inlineButton}
            disabled={
              isPending ||
              isVerified ||
              !requestId ||
              verificationCode.trim().length < 6
            }
            onClick={handleVerifyCode}
            type="button"
          >
            확인
          </button>
        </div>
      </label>

      {errorMessage ? <p className={styles.formMessage}>{errorMessage}</p> : null}
      {feedback ? (
        <p className={isVerified ? styles.formSuccessMessage : styles.formHelperMessage}>
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
