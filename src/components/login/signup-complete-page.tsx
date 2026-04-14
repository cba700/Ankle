"use client";

import { useState, useTransition } from "react";
import { buildAuthContinueHref } from "@/lib/auth/redirect";
import {
  areRequiredSignupAgreementsAccepted,
  isAtLeastAge,
  normalizeBirthDate,
  normalizeLegalName,
  type ProfileGender,
  type SignupAgreementValues,
} from "@/lib/signup-profile";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { SignupAgreementSection } from "./signup-agreement-section";
import styles from "./login-page.module.css";

type SignupCompletePageProps = {
  accountLabel: string;
  initialAgreements: SignupAgreementValues;
  initialBirthDate: string;
  initialGender: ProfileGender | null;
  initialLegalName: string;
  nextPath: string;
};

export function SignupCompletePage({
  accountLabel,
  initialAgreements,
  initialBirthDate,
  initialGender,
  initialLegalName,
  nextPath,
}: SignupCompletePageProps) {
  const [agreements, setAgreements] = useState(initialAgreements);
  const [birthDate, setBirthDate] = useState(initialBirthDate);
  const [gender, setGender] = useState<ProfileGender | null>(initialGender);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [legalName, setLegalName] = useState(initialLegalName);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setInlineError(null);

      const normalizedLegalName = normalizeLegalName(legalName);
      const normalizedBirthDate = normalizeBirthDate(birthDate);

      if (!normalizedLegalName) {
        setInlineError("이름을 입력해 주세요.");
        return;
      }

      if (!normalizedBirthDate) {
        setInlineError("생년월일을 정확히 입력해 주세요.");
        return;
      }

      if (!gender) {
        setInlineError("성별을 선택해 주세요.");
        return;
      }

      if (!isAtLeastAge(normalizedBirthDate, 16) || !agreements.ageOver16) {
        setInlineError("만 16세 이상만 가입할 수 있습니다.");
        return;
      }

      if (!areRequiredSignupAgreementsAccepted(agreements)) {
        setInlineError("필수 약관에 모두 동의해 주세요.");
        return;
      }

      const response = await fetch("/api/auth/signup-completion", {
        body: JSON.stringify({
          agreements,
          birthDate: normalizedBirthDate,
          gender,
          name: normalizedLegalName,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            ok?: boolean;
          }
        | null;

      if (!response.ok || !payload?.ok) {
        setInlineError(
          payload?.message ?? "가입 정보를 저장하지 못했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      window.location.href = buildAuthContinueHref(nextPath);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AppLink className={styles.logoWrap} href="/">
          <span className={styles.logoWord}>앵클</span>
          <span className={styles.logoDot}>.</span>
        </AppLink>
        <p className={styles.tagline}>가입 정보 확인</p>

        <div className={styles.infoPanel}>
          <p className={styles.accountTitle}>현재 계정</p>
          <p className={styles.accountEmail}>{accountLabel}</p>
          <p className={styles.infoDescription}>
            경기 신청과 운영을 위해 필요한 가입 정보를 마무리해 주세요.
          </p>
        </div>

        {inlineError ? <p className={styles.errorMessage}>{inlineError}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이름</span>
            <input
              autoComplete="name"
              className={styles.textField}
              onChange={(event) => setLegalName(event.target.value)}
              placeholder="실명을 입력해 주세요"
              type="text"
              value={legalName}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>생년월일</span>
            <input
              className={styles.textField}
              max="9999-12-31"
              onChange={(event) => setBirthDate(event.target.value)}
              type="date"
              value={birthDate}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>성별</span>
            <div className={styles.segmentedRow}>
              <button
                aria-pressed={gender === "male"}
                className={`${styles.segmentedButton} ${
                  gender === "male" ? styles.segmentedButtonActive : ""
                }`}
                onClick={() => setGender("male")}
                type="button"
              >
                남
              </button>
              <button
                aria-pressed={gender === "female"}
                className={`${styles.segmentedButton} ${
                  gender === "female" ? styles.segmentedButtonActive : ""
                }`}
                onClick={() => setGender("female")}
                type="button"
              >
                여
              </button>
            </div>
          </div>

          <SignupAgreementSection
            disabled={isPending}
            onChange={setAgreements}
            value={agreements}
          />

          <button
            className={styles.primaryButton}
            disabled={isPending || !birthDate || !gender || legalName.trim().length === 0}
            type="submit"
          >
            {isPending ? "저장 중..." : "가입 완료"}
          </button>
        </form>
      </div>
      <LegalFooter />
    </div>
  );
}
