import styles from "./login-page.module.css";

export function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <span className={styles.logoWord}>앵클</span>
          <span className={styles.logoDot}>.</span>
        </div>
        <p className={styles.tagline}>코트에서 만나는 모든 농구</p>

        <button className={styles.kakaoButton} type="button">
          <KakaoIcon />
          <span>카카오로 3초 만에 시작하기</span>
        </button>

        <p className={styles.terms}>
          로그인 시 <span className={styles.termsLink}>이용약관</span> 및{" "}
          <span className={styles.termsLink}>개인정보 처리방침</span>에 동의하게 됩니다.
        </p>
      </div>

      <footer className={styles.footer}>
        <span className={styles.footerLink}>이용약관</span>
        <span className={styles.footerDivider}>|</span>
        <span className={styles.footerLink}>개인정보 처리방침</span>
      </footer>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.kakaoIcon}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.61 1.7 4.9 4.26 6.23l-.97 3.53c-.08.3.26.54.52.36L11.1 18c.29.02.59.03.9.03 4.97 0 9-3.36 9-7.5S16.97 3 12 3Z" />
    </svg>
  );
}
