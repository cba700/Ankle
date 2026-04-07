"use client";

import { useEffect, useState } from "react";
import { AppLink } from "@/components/navigation/app-link";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import styles from "./login-page.module.css";

type LoginPageProps = {
  errorCode?: string;
  nextPath: string;
};

type LoginStatus =
  | { status: "loading" }
  | { status: "signedOut" }
  | { email: string; status: "signedIn" };

const ERROR_MESSAGES: Record<string, string> = {
  callback_code_missing: "카카오 로그인 응답이 올바르지 않았습니다. 다시 시도해 주세요.",
  oauth_failed: "카카오 로그인에 실패했습니다. 다시 시도해 주세요.",
  supabase_not_configured: "Supabase 환경변수가 설정되지 않았습니다.",
};

export function LoginPage({ errorCode, nextPath }: LoginPageProps) {
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus>({ status: "loading" });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setLoginStatus({ status: "signedOut" });
      return;
    }

    const activeSupabase = supabase;
    let isMounted = true;

    async function syncLoginStatus() {
      try {
        const {
          data: { user },
        } = await activeSupabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (!user) {
          setLoginStatus({ status: "signedOut" });
          return;
        }

        setLoginStatus({
          email: user.email ?? "카카오 계정",
          status: "signedIn",
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setLoginStatus({ status: "signedOut" });
      }
    }

    void syncLoginStatus();

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange(() => {
      void syncLoginStatus();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleKakaoLogin() {
    const supabase = getSupabaseBrowserClient();

    if (!supabase || isSubmitting || !isSupabaseConfigured()) {
      return;
    }

    setInlineError(null);
    setIsSubmitting(true);

    try {
      const redirectTo = new URL("/auth/callback", window.location.origin);

      if (nextPath !== "/") {
        redirectTo.searchParams.set("next", nextPath);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        options: {
          redirectTo: redirectTo.toString(),
        },
        provider: "kakao",
      });

      if (error) {
        setInlineError("카카오 로그인으로 이동하지 못했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setInlineError("카카오 로그인 요청 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const serverError = errorCode ? ERROR_MESSAGES[errorCode] : null;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <AppLink className={styles.logoWrap} href="/">
          <span className={styles.logoWord}>앵클</span>
          <span className={styles.logoDot}>.</span>
        </AppLink>
        <p className={styles.tagline}>코트에서 만나는 모든 농구</p>

        {serverError || inlineError ? (
          <p className={styles.errorMessage}>{serverError ?? inlineError}</p>
        ) : null}

        {!isSupabaseConfigured() ? (
          <p className={styles.helperText}>
            Supabase가 아직 연결되지 않았습니다. 환경변수를 먼저 설정해 주세요.
          </p>
        ) : null}

        {loginStatus.status === "signedIn" ? (
          <div className={styles.accountPanel}>
            <p className={styles.accountTitle}>이미 로그인되어 있습니다.</p>
            <p className={styles.accountEmail}>{loginStatus.email}</p>

            <div className={styles.actionRow}>
              <AppLink className={styles.secondaryButton} href={nextPath}>
                {nextPath === "/" ? "홈으로 이동" : "원래 화면으로 이동"}
              </AppLink>

              <form action="/auth/signout" className={styles.actionForm} method="post">
                <button className={styles.ghostButton} type="submit">
                  로그아웃
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button
            className={`${styles.kakaoButton} ${
              isSubmitting || !isSupabaseConfigured() ? styles.kakaoButtonDisabled : ""
            }`}
            disabled={isSubmitting || !isSupabaseConfigured()}
            onClick={handleKakaoLogin}
            type="button"
          >
            <KakaoIcon />
            <span>
              {isSubmitting ? "카카오 로그인으로 이동 중..." : "카카오로 3초 만에 시작하기"}
            </span>
          </button>
        )}

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
