"use client";

import { buildAuthContinueHref } from "@/lib/auth/redirect";
import { BrandLogo } from "@/components/branding/brand-logo";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { PhoneVerificationForm } from "./phone-verification-form";
import styles from "./login-page.module.css";

type VerifyPhonePageProps = {
  accountLabel: string;
  nextPath: string;
};

export function VerifyPhonePage({
  accountLabel,
  nextPath,
}: VerifyPhonePageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AppLink className={styles.logoWrap} href="/">
          <BrandLogo className={styles.logoImage} priority />
        </AppLink>
        <p className={styles.tagline}>휴대폰 인증</p>

        <div className={styles.infoPanel}>
          <p className={styles.accountTitle}>현재 계정</p>
          <p className={styles.accountEmail}>{accountLabel}</p>
          <p className={styles.infoDescription}>
            충전이나 매치 신청을 진행하기 전에 1회 휴대폰 인증이 필요합니다.
          </p>
        </div>

        <PhoneVerificationForm
          onVerified={() => {
            window.location.href = buildAuthContinueHref(nextPath);
          }}
          purpose="activation"
        />

        <form action="/auth/signout" className={styles.signoutForm} method="post">
          <button className={styles.ghostButton} type="submit">
            다른 계정으로 로그인
          </button>
        </form>
      </div>
      <LegalFooter />
    </div>
  );
}
