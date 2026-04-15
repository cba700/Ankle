"use client";

import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowLeftIcon, BadgeIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import type { MyPageCoupon } from "@/lib/mypage";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-coupons.module.css";

type MyPageCouponsProps = {
  couponCount: number;
  coupons: MyPageCoupon[];
  initialIsAdmin: boolean;
};

export function MyPageCoupons({
  couponCount,
  coupons,
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

        <section className={styles.summaryCard}>
          <span className={styles.summaryBadge}>
            <BadgeIcon className={styles.summaryBadgeIcon} />
            쿠폰
          </span>
          <div className={styles.summaryCopy}>
            <p className={styles.summaryEyebrow}>사용 가능한 쿠폰</p>
            <h1 className={styles.summaryValue}>{couponCount}</h1>
          </div>
        </section>

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>내 쿠폰</p>
              <h2 className={baseStyles.sectionTitle}>쿠폰 목록</h2>
            </div>
            <span className={baseStyles.sectionCount}>{coupons.length}</span>
          </div>

          {coupons.length === 0 ? (
            <div className={baseStyles.emptyState}>
              <strong>받은 쿠폰이 없습니다.</strong>
              <p>신규가입 쿠폰이 지급되면 여기에서 바로 확인할 수 있습니다.</p>
            </div>
          ) : (
            <div className={styles.couponList}>
              {coupons.map((coupon) => (
                <article className={styles.couponCard} key={coupon.id}>
                  <div className={styles.couponTop}>
                    <strong className={styles.couponName}>{coupon.name}</strong>
                    <span
                      className={`${styles.couponStatus} ${
                        coupon.statusTone === "accent"
                          ? styles.couponStatusAccent
                          : coupon.statusTone === "danger"
                            ? styles.couponStatusDanger
                            : styles.couponStatusMuted
                      }`}
                    >
                      {coupon.statusLabel}
                    </span>
                  </div>
                  <strong className={styles.couponAmount}>{coupon.discountLabel}</strong>
                  <p className={styles.couponMeta}>{coupon.metaLabel}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
