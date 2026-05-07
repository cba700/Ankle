"use client";

import { useState, useTransition } from "react";
import { buildAuthContinueHref } from "@/lib/auth/redirect";
import {
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from "@/lib/referral-code";
import {
  areRequiredSignupAgreementsAccepted,
  getDefaultSignupAgreementValues,
  isAtLeastAge,
  normalizeBirthDate,
  normalizeLegalName,
  type ProfileGender,
} from "@/lib/signup-profile";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/branding/brand-logo";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import {
  BirthDateFields,
  buildBirthDateFromParts,
  parseBirthDateParts,
} from "./birth-date-fields";
import { PhoneVerificationForm } from "./phone-verification-form";
import { SignupAgreementSection } from "./signup-agreement-section";
import styles from "./login-page.module.css";

type EmailSignupPageProps = {
  initialReferralCode: string;
  nextPath: string;
};

type VerifiedPhoneState = {
  maskedPhoneNumber: string;
  phoneNumberE164: string;
  verifiedAt: string;
};

export function EmailSignupPage({
  initialReferralCode,
  nextPath,
}: EmailSignupPageProps) {
  const [agreements, setAgreements] = useState(getDefaultSignupAgreementValues());
  const [birthDateParts, setBirthDateParts] = useState(() => parseBirthDateParts(""));
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [legalName, setLegalName] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [verifiedPhone, setVerifiedPhone] = useState<VerifiedPhoneState | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setInlineError(null);

      if (!verifiedPhone) {
        setInlineError("휴대폰 인증을 먼저 완료해 주세요.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setInlineError("이메일 형식을 다시 확인해 주세요.");
        return;
      }

      if (password.length < 8) {
        setInlineError("비밀번호는 8자 이상이어야 합니다.");
        return;
      }

      if (password !== passwordConfirm) {
        setInlineError("비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      const normalizedLegalName = normalizeLegalName(legalName);
      const normalizedBirthDate = normalizeBirthDate(
        buildBirthDateFromParts(birthDateParts),
      );

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

      const normalizedReferralCode = normalizeReferralCode(referralCode);

      if (
        normalizedReferralCode &&
        !isValidReferralCodeFormat(normalizedReferralCode)
      ) {
        setInlineError("초대 코드는 영문과 숫자 5자리로 입력해 주세요.");
        return;
      }

      const response = await fetch("/api/auth/email-signup", {
        body: JSON.stringify({
          agreements,
          birthDate: normalizedBirthDate,
          email,
          gender,
          name: normalizedLegalName,
          password,
          referralCode: normalizedReferralCode,
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
          payload?.message ?? "회원가입에 실패했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      const supabase = getSupabaseBrowserClient();

      if (!supabase || !isSupabaseConfigured()) {
        setInlineError("회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 로그인해 주세요.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setInlineError("회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 로그인해 주세요.");
        return;
      }

      window.location.href = buildAuthContinueHref(nextPath);
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AppLink className={styles.logoWrap} href="/">
          <BrandLogo className={styles.logoImage} priority />
        </AppLink>
        <p className={styles.tagline}>이메일로 회원가입</p>

        {!isSupabaseConfigured() ? (
          <p className={styles.helperText}>
            Supabase가 아직 연결되지 않았습니다. 환경변수를 먼저 설정해 주세요.
          </p>
        ) : null}

        {inlineError ? <p className={styles.errorMessage}>{inlineError}</p> : null}

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>이메일</span>
            <input
              autoComplete="email"
              className={styles.textField}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>비밀번호</span>
            <input
              autoComplete="new-password"
              className={styles.textField}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8자 이상 입력해 주세요"
              type="password"
              value={password}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>비밀번호 확인</span>
            <input
              autoComplete="new-password"
              className={styles.textField}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              type="password"
              value={passwordConfirm}
            />
          </label>

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

          <BirthDateFields
            disabled={isPending}
            onChange={setBirthDateParts}
            value={birthDateParts}
          />

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

          <PhoneVerificationForm
            onVerified={(result) => {
              setInlineError(null);
              setVerifiedPhone(result);
            }}
            purpose="signup"
          />

          {verifiedPhone ? (
            <p className={styles.formSuccessMessage}>
              인증된 번호 {verifiedPhone.maskedPhoneNumber}
            </p>
          ) : null}

          <label className={styles.field}>
            <span className={styles.fieldLabel}>초대 코드 (선택)</span>
            <input
              autoComplete="off"
              className={styles.textField}
              maxLength={5}
              onChange={(event) => setReferralCode(event.target.value)}
              placeholder="예: 13NBg"
              type="text"
              value={referralCode}
            />
          </label>
          <p className={styles.formHelperMessage}>
            친구에게 받은 코드가 있으면 가입 완료 시 2,000원 쿠폰이 지급됩니다.
          </p>

          <SignupAgreementSection
            disabled={isPending}
            onChange={setAgreements}
            value={agreements}
          />

          <button
            className={styles.primaryButton}
            disabled={
              isPending ||
              !isSupabaseConfigured() ||
              !birthDateParts.year ||
              !birthDateParts.month ||
              !birthDateParts.day ||
              !gender ||
              !verifiedPhone ||
              email.trim().length === 0 ||
              legalName.trim().length === 0 ||
              password.length === 0 ||
              passwordConfirm.length === 0
            }
            type="submit"
          >
            {isPending ? "회원가입 중..." : "회원가입"}
          </button>

          <div className={styles.linkRow}>
            <span className={styles.linkText}>이미 계정이 있나요?</span>
            <AppLink
              className={styles.inlineLink}
              href={`/login/email${buildNextQuery(nextPath, referralCode)}`}
            >
              로그인
            </AppLink>
          </div>
        </form>
      </div>
      <LegalFooter />
    </div>
  );
}

function buildNextQuery(nextPath: string, referralCode?: string) {
  const params = new URLSearchParams();
  const normalizedReferralCode = normalizeReferralCode(referralCode);

  if (nextPath !== "/") {
    params.set("next", nextPath);
  }

  if (normalizedReferralCode) {
    params.set("ref", normalizedReferralCode);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
