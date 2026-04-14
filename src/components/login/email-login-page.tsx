"use client";

import { useEffect, useState, useTransition } from "react";
import { buildAuthContinueHref } from "@/lib/auth/redirect";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./login-page.module.css";

type EmailLoginPageProps = {
  nextPath: string;
};

type LoginStatus =
  | { status: "loading" }
  | { status: "signedOut" }
  | { email: string; status: "signedIn" };

export function EmailLoginPage({ nextPath }: EmailLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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
        email: user.email ?? "앵클 사용자",
        status: "signedIn",
      });
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();

      if (!supabase || !isSupabaseConfigured()) {
        setInlineError("Supabase 환경변수가 설정되지 않았습니다.");
        return;
      }

      setInlineError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setInlineError("이메일 또는 비밀번호를 다시 확인해 주세요.");
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
        <p className={styles.tagline}>이메일로 로그인</p>

        {!isSupabaseConfigured() ? (
          <p className={styles.helperText}>
            Supabase가 아직 연결되지 않았습니다. 환경변수를 먼저 설정해 주세요.
          </p>
        ) : null}

        {inlineError ? <p className={styles.errorMessage}>{inlineError}</p> : null}

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
                autoComplete="current-password"
                className={styles.textField}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력해 주세요"
                type="password"
                value={password}
              />
            </label>

            <button
              className={styles.primaryButton}
              disabled={
                isPending ||
                !isSupabaseConfigured() ||
                email.trim().length === 0 ||
                password.length === 0
              }
              type="submit"
            >
              {isPending ? "로그인 중..." : "로그인"}
            </button>

            <div className={styles.linkRow}>
              <span className={styles.placeholderLink}>아이디 찾기</span>
              <span className={styles.linkDivider} aria-hidden="true">
                /
              </span>
              <span className={styles.placeholderLink}>비밀번호 찾기</span>
              <span className={styles.linkDivider} aria-hidden="true">
                /
              </span>
              <AppLink className={styles.inlineLink} href={`/signup${buildNextQuery(nextPath)}`}>
                회원가입
              </AppLink>
            </div>
          </form>
        )}

        <p className={styles.terms}>
          로그인 시 <AppLink className={styles.termsLink} href="/terms">이용약관</AppLink> 및{" "}
          <AppLink className={styles.termsLink} href="/privacy">
            개인정보 처리방침
          </AppLink>
          에 동의하게 됩니다.
        </p>
      </div>
      <LegalFooter />
    </div>
  );
}

function buildNextQuery(nextPath: string) {
  return nextPath === "/" ? "" : `?next=${encodeURIComponent(nextPath)}`;
}
