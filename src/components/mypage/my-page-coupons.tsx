"use client";

import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowLeftIcon, BadgeIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-coupons.module.css";

type MyPageCouponsProps = {
  couponCount: number;
  initialIsAdmin: boolean;
};

export function MyPageCoupons({
  couponCount,
  initialIsAdmin,
}: MyPageCouponsProps) {
  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <BrandLogo className={baseStyles.brandLogo} priority />
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

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <BadgeIcon className={styles.heroBadgeIcon} />
              Coupon Wallet
            </span>
            <p className={styles.heroEyebrow}>보유 쿠폰</p>
            <h1 className={styles.heroTitle}>{couponCount}</h1>
            <p className={styles.heroDescription}>
              사용 가능한 쿠폰 수를 한곳에서 확인할 수 있습니다. 현재는 쿠폰 기능이 아직 연결되기
              전 단계입니다.
            </p>
          </div>
        </section>

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>현재 상태</p>
              <h2 className={baseStyles.sectionTitle}>쿠폰 목록</h2>
            </div>
            <span className={baseStyles.sectionCount}>{couponCount}</span>
          </div>

          {couponCount === 0 ? (
            <div className={baseStyles.emptyState}>
              <strong>보유한 쿠폰이 없습니다.</strong>
              <p>쿠폰 기능이 연결되면 이 페이지에서 보유 쿠폰과 사용 가능 상태를 확인할 수 있습니다.</p>
            </div>
          ) : (
            <div className={baseStyles.emptyState}>
              <strong>쿠폰 데이터 연결 예정</strong>
              <p>현재는 보유 수만 노출하고 있으며, 실제 쿠폰 목록 UI는 다음 단계에서 연결됩니다.</p>
            </div>
          )}
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
