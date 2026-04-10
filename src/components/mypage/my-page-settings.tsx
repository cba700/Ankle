"use client";

import type { MyPageProfile } from "@/lib/mypage";
import { ArrowLeftIcon, CogIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-settings.module.css";

type MyPageSettingsProps = {
  initialIsAdmin: boolean;
  profile: MyPageProfile;
};

export function MyPageSettings({
  initialIsAdmin,
  profile,
}: MyPageSettingsProps) {
  const initials = profile.displayName.slice(0, 1).toUpperCase() || "A";
  const infoRows = [
    { label: "이름", value: profile.displayName },
    { label: "이메일", value: profile.email },
    { label: "로그인 방식", value: profile.providerLabel },
    { label: "권한", value: getRoleLabel(profile.role) },
  ];

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <span className={baseStyles.brandWord}>앵클</span>
            <span className={baseStyles.brandDot}>.</span>
          </AppLink>

          <div className={baseStyles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={initialIsAdmin}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={`pageShell ${styles.main}`}>
        <AppLink className={styles.backLink} href="/mypage">
          <ArrowLeftIcon className={styles.backIcon} />
          마이페이지로 돌아가기
        </AppLink>

        <section className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <span className={styles.avatar}>
              {profile.avatarUrl ? (
                <img alt="" className={styles.avatarImage} src={profile.avatarUrl} />
              ) : (
                initials
              )}
            </span>
            <div className={styles.summaryCopy}>
              <span className={styles.badge}>
                <CogIcon className={styles.badgeIcon} />
                설정
              </span>
              <h1 className={styles.title}>계정 관리</h1>
            </div>
          </div>
        </section>

        <section className={styles.infoCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>기본 정보</h2>
          </div>

          <div className={styles.infoList}>
            {infoRows.map((row) => (
              <div className={styles.infoRow} key={row.label}>
                <span className={styles.infoLabel}>{row.label}</span>
                <strong className={styles.infoValue}>{row.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.actionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>계정 액션</h2>
          </div>

          <div className={styles.actionList}>
            <form action="/auth/signout" method="post">
              <button className={styles.signOutButton} type="submit">
                로그아웃
              </button>
            </form>

            <div className={styles.withdrawRow}>
              <button className={styles.withdrawButton} disabled type="button">
                회원 탈퇴
              </button>
              <span className={styles.withdrawMeta}>준비 중</span>
            </div>
          </div>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

function getRoleLabel(role: MyPageProfile["role"]) {
  return role === "admin" ? "관리자" : "일반 사용자";
}
