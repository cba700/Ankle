import type { MyPageData } from "@/lib/mypage";
import {
  ArrowRightIcon,
  BadgeIcon,
  BellIcon,
  BasketIcon,
  ClockIcon,
  CogIcon,
  CopyIcon,
  HeartIcon,
  PencilIcon,
  QuestionIcon,
  SearchIcon,
} from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import styles from "./my-page.module.css";

type MyPageProps = {
  data: MyPageData;
};

type MenuItem = {
  href?: string;
  icon: "applications" | "history" | "coupon" | "wishlist" | "profile" | "settings" | "faq" | "notice";
  key: string;
  label: string;
  statusText?: string;
};

const SUPPORT_MENU_ITEMS: MenuItem[] = [
  {
    icon: "faq",
    key: "faq",
    label: "자주 묻는 질문",
    statusText: "미구현",
  },
  {
    icon: "notice",
    key: "notice",
    label: "공지사항",
    statusText: "미구현",
  },
];

export function MyPage({ data }: MyPageProps) {
  const initials = data.profile.displayName.slice(0, 1).toUpperCase() || "A";
  const myMenuItems: MenuItem[] = [
    {
      href: "/mypage/applications",
      icon: "applications",
      key: "applications",
      label: "신청 내역",
    },
    {
      href: "/mypage/cash",
      icon: "history",
      key: "history",
      label: "캐시 내역",
    },
    {
      href: "/mypage/coupons",
      icon: "coupon",
      key: "coupon",
      label: "쿠폰",
      statusText: String(data.couponCount),
    },
    {
      href: "/mypage/wishlist",
      icon: "wishlist",
      key: "wishlist",
      label: "관심 매치",
      statusText: `${data.wishlistCount}건`,
    },
    {
      icon: "profile",
      key: "profile",
      label: "프로필 수정",
      statusText: "미구현",
    },
    {
      icon: "settings",
      key: "settings",
      label: "설정",
      href: "/mypage/settings",
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <AppLink className={styles.brand} href="/">
            <span className={styles.brandWord}>앵클</span>
            <span className={styles.brandDot}>.</span>
          </AppLink>

          <div className={styles.headerActions}>
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={data.profile.role === "admin"}
              initialSignedIn
            />
            <label className={styles.search}>
              <SearchIcon className={styles.searchIcon} />
              <span className="visuallyHidden">검색</span>
              <input
                className={styles.searchInput}
                placeholder="지역, 코트, 팀 이름으로 찾기"
                readOnly
                type="text"
              />
            </label>
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

              <div className={styles.profileActions}>
                <button className={styles.secondaryButton} disabled type="button">
                  프로필 보기
                  <span className={styles.inlineBadge}>미구현</span>
                </button>
                <button
                  aria-label="QR 준비 중"
                  className={styles.iconAction}
                  disabled
                  type="button"
                >
                  <CopyIcon className={styles.actionIcon} />
                </button>
              </div>
            </div>

            <div className={styles.statRow}>
              <div className={styles.statBox}>
                <span className={styles.statLabel}>매너</span>
                <strong className={styles.statValue}>미구현</strong>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statBox}>
                <span className={styles.statLabel}>레벨</span>
                <strong className={styles.statValue}>
                  <span className={styles.levelMarker} />
                  미구현
                </strong>
              </div>
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

          <article className={styles.guideCard}>
            <div>
              <p className={styles.guideEyebrow}>앵클 가이드</p>
              <strong className={styles.guideTitle}>레벨 시스템을 소개합니다</strong>
              <p className={styles.guideMeta}>콘텐츠 연결 전까지 미구현 상태로 노출됩니다.</p>
            </div>
            <span className={styles.guideBadge}>i</span>
          </article>
        </section>

        <section className={styles.rightColumn}>
          <article className={styles.menuSection}>
            <p className={styles.menuSectionTitle}>나의 앵클</p>
            <div className={styles.menuList}>
              {myMenuItems.map((item) => {
                const content = (
                  <>
                    <span className={styles.menuIconWrap}>
                      {renderMenuIcon(item.icon)}
                    </span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    {item.statusText ? (
                      <span className={styles.menuMeta}>{item.statusText}</span>
                    ) : (
                      <span aria-hidden="true" className={styles.menuMetaPlaceholder} />
                    )}
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
            <p className={styles.menuSectionTitle}>고객센터</p>
            <div className={styles.menuList}>
              {SUPPORT_MENU_ITEMS.map((item) => (
                <div
                  aria-disabled="true"
                  className={`${styles.menuRow} ${styles.menuRowDisabled}`}
                  key={item.key}
                >
                  <span className={styles.menuIconWrap}>
                    {renderMenuIcon(item.icon)}
                  </span>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <span className={styles.menuMeta}>{item.statusText}</span>
                  <ArrowRightIcon className={styles.menuArrow} />
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}

function renderMenuIcon(icon: MenuItem["icon"]) {
  switch (icon) {
    case "applications":
      return <BasketIcon className={styles.menuIcon} />;
    case "history":
      return <ClockIcon className={styles.menuIcon} />;
    case "coupon":
      return <BadgeIcon className={styles.menuIcon} />;
    case "wishlist":
      return <HeartIcon className={styles.menuIcon} />;
    case "profile":
      return <PencilIcon className={styles.menuIcon} />;
    case "settings":
      return <CogIcon className={styles.menuIcon} />;
    case "faq":
      return <QuestionIcon className={styles.menuIcon} />;
    case "notice":
    default:
      return <BellIcon className={styles.menuIcon} />;
  }
}
