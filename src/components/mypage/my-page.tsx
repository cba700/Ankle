import type { MyPageData } from "@/lib/mypage";
import { formatTemporaryLevel } from "@/lib/player-preferences";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowRightIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import styles from "./my-page.module.css";

type MyPageProps = {
  data: MyPageData;
};

type MenuItem = {
  href?: string;
  key: string;
  label: string;
  external?: boolean;
  statusText?: string;
};

export function MyPage({ data }: MyPageProps) {
  const initials = data.profile.displayName.slice(0, 1).toUpperCase() || "A";
  const kakaoChannelUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL?.trim();
  const temporaryLevelLabel = formatTemporaryLevel(data.profile.temporaryLevel);
  const myMenuItems: MenuItem[] = [
    {
      href: "/mypage/applications",
      key: "applications",
      label: "신청 내역",
    },
    {
      href: "/mypage/cash",
      key: "history",
      label: "캐시 내역",
    },
    {
      href: "/mypage/coupons",
      key: "coupon",
      label: "쿠폰",
      statusText: String(data.couponCount),
    },
    {
      href: "/mypage/wishlist",
      key: "wishlist",
      label: "관심 매치",
      statusText: `${data.wishlistCount}건`,
    },
    {
      href: "/mypage/referrals",
      key: "referrals",
      label: "친구 초대",
    },
    {
      key: "settings",
      label: "설정",
      href: "/mypage/settings",
    },
  ];
  const guideMenuItems: MenuItem[] = [
    {
      href: "/mypage/guide",
      key: "level-guide",
      label: "레벨 가이드",
    },
  ];
  const supportMenuItems: MenuItem[] = [
    {
      external: true,
      href: kakaoChannelUrl,
      key: "contact",
      label: "문의하기",
      statusText: kakaoChannelUrl ? "카카오톡 상담" : "준비 중",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <AppLink className={styles.brand} href="/">
            <BrandLogo className={styles.brandLogo} priority />
          </AppLink>

          <div className={styles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={data.profile.role === "admin"}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.leftColumn}>
          <article className={styles.profileCard}>
            <div className={styles.profileTop}>
              <div className={styles.profileIdentity}>
                <span className={styles.avatar}>
                  {data.profile.avatarUrl ? (
                    <img
                      alt=""
                      className={styles.avatarImage}
                      src={data.profile.avatarUrl}
                    />
                  ) : (
                    initials
                  )}
                </span>

                <div className={styles.profileCopy}>
                  <div className={styles.nameRow}>
                    <strong className={styles.profileName}>{data.profile.displayName}</strong>
                    {data.profile.role === "admin" ? (
                      <span className={styles.roleBadge}>ADMIN</span>
                    ) : null}
                  </div>
                  <p className={styles.profileEmail}>
                    {data.profile.email}
                    <span className={styles.providerBadge}>{data.profile.providerLabel}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>레벨</span>
                <strong className={styles.statValue}>
                  <span className={styles.levelMarker} />
                  {temporaryLevelLabel}
                </strong>
                <AppLink className={styles.statLink} href="/mypage/guide">
                  가이드 보기
                  <ArrowRightIcon className={styles.statLinkArrow} />
                </AppLink>
              </div>
              <AppLink className={`${styles.statBox} ${styles.statBoxLink}`} href="/about">
                <strong className={styles.statBoxTitle}>앵클 소개</strong>
              </AppLink>
            </div>
          </article>

          <article className={styles.cashCard}>
            <div>
              <p className={styles.cashLabel}>나의 캐시</p>
              <strong className={styles.cashAmount}>{data.cashBalanceLabel}</strong>
            </div>
            <AppLink className={styles.chargeButton} href="/cash/charge">
              캐시 충전
            </AppLink>
          </article>
        </section>

        <section className={styles.rightColumn}>
          <article className={styles.menuSection}>
            <p className={styles.menuSectionTitle}>나의 앵클</p>
            <div className={styles.menuList}>
              {myMenuItems.map((item) => {
                const content = (
                  <>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.statusText ? <span className={styles.menuMeta}>{item.statusText}</span> : null}
                    <ArrowRightIcon className={styles.menuArrow} />
                  </>
                );

                if (!item.href) {
                  return (
                    <div
                      aria-disabled="true"
                      className={`${styles.menuRow} ${styles.menuRowDisabled}`}
                      key={item.key}
                    >
                      {content}
                    </div>
                  );
                }

                return item.href.startsWith("#") ? (
                  <a className={styles.menuRow} href={item.href} key={item.key}>
                    {content}
                  </a>
                ) : (
                  <AppLink className={styles.menuRow} href={item.href} key={item.key}>
                    {content}
                  </AppLink>
                );
              })}
            </div>
          </article>

          <article className={styles.menuSection}>
            <p className={styles.menuSectionTitle}>앵클 가이드</p>
            <div className={styles.menuList}>
              {guideMenuItems.map((item) => {
                const content = (
                  <>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.statusText ? <span className={styles.menuMeta}>{item.statusText}</span> : null}
                    <ArrowRightIcon className={styles.menuArrow} />
                  </>
                );

                if (!item.href) {
                  return (
                    <div
                      aria-disabled="true"
                      className={`${styles.menuRow} ${styles.menuRowDisabled}`}
                      key={item.key}
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <AppLink className={styles.menuRow} href={item.href} key={item.key}>
                    {content}
                  </AppLink>
                );
              })}
            </div>
          </article>

          <article className={styles.menuSection}>
            <p className={styles.menuSectionTitle}>고객센터</p>
            <div className={styles.menuList}>
              {supportMenuItems.map((item) => {
                const content = (
                  <>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={styles.menuMeta}>{item.statusText}</span>
                    <ArrowRightIcon className={styles.menuArrow} />
                  </>
                );

                if (!item.href) {
                  return (
                    <div
                      aria-disabled="true"
                      className={`${styles.menuRow} ${styles.menuRowDisabled}`}
                      key={item.key}
                    >
                      {content}
                    </div>
                  );
                }

                if (item.external) {
                  return (
                    <a
                      className={styles.menuRow}
                      href={item.href}
                      key={item.key}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <AppLink className={styles.menuRow} href={item.href} key={item.key}>
                    {content}
                  </AppLink>
                );
              })}
            </div>
          </article>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
