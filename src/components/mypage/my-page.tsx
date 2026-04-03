import Link from "next/link";
import type { MyPageData } from "@/lib/mypage";
import {
  ArrowRightIcon,
  BadgeIcon,
  BellIcon,
  BasketIcon,
  CalendarIcon,
  ClockIcon,
  CogIcon,
  CopyIcon,
  HeartIcon,
  PencilIcon,
  QuestionIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import styles from "./my-page.module.css";

type MyPageProps = {
  data: MyPageData;
};

type MenuItem = {
  href?: string;
  icon: "applications" | "history" | "coupon" | "wishlist" | "profile" | "settings" | "faq" | "notice";
  key: string;
  label: string;
  statusText: string;
};

const MY_MENU_ITEMS: MenuItem[] = [
  {
    href: "#mypage-applications",
    icon: "applications",
    key: "applications",
    label: "신청 내역",
    statusText: "바로가기",
  },
  {
    icon: "history",
    key: "history",
    label: "사용 내역",
    statusText: "미구현",
  },
  {
    icon: "coupon",
    key: "coupon",
    label: "쿠폰",
    statusText: "미구현",
  },
  {
    icon: "wishlist",
    key: "wishlist",
    label: "관심 매치",
    statusText: "미구현",
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
    statusText: "미구현",
  },
];

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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandWord}>앵클</span>
            <span className={styles.brandDot}>.</span>
          </Link>

          <div className={styles.headerActions}>
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
            <button
              aria-label="일정 준비 중"
              className={styles.iconButton}
              disabled
              type="button"
            >
              <CalendarIcon className={styles.actionIcon} />
            </button>
            <Link
              aria-current="page"
              aria-label="마이페이지"
              className={`${styles.iconButton} ${styles.iconButtonActive}`}
              href="/mypage"
            >
              <UserIcon className={styles.actionIcon} />
            </Link>
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
              <strong className={styles.cashAmount}>미구현</strong>
            </div>
            <button className={styles.chargeButton} disabled type="button">
              충전하기
            </button>
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
              {MY_MENU_ITEMS.map((item) =>
                item.href ? (
                  <a className={styles.menuRow} href={item.href} key={item.key}>
                    <span className={styles.menuIconWrap}>
                      {renderMenuIcon(item.icon)}
                    </span>
                    <span className={styles.menuLabel}>{item.label}</span>
                    <span className={styles.menuMeta}>{item.statusText}</span>
                    <ArrowRightIcon className={styles.menuArrow} />
                  </a>
                ) : (
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
                ),
              )}
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

          <section className={styles.applicationSection} id="mypage-applications">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.sectionEyebrow}>실제 데이터</p>
                <h1 className={styles.sectionTitle}>신청 내역</h1>
              </div>
              <span className={styles.sectionCount}>{data.applications.length}건</span>
            </div>

            {data.applications.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>아직 신청한 매치가 없습니다.</strong>
                <p>메인 화면에서 원하는 매치를 찾아 첫 신청을 시작해 보세요.</p>
                <Link className={styles.homeLink} href="/">
                  홈에서 매치 보기
                </Link>
              </div>
            ) : (
              <div className={styles.applicationList}>
                {data.applications.map((application) => {
                  const content = (
                    <>
                      <div className={styles.applicationTop}>
                        <span
                          className={`${styles.statusBadge} ${
                            application.statusTone === "danger"
                              ? styles.statusDanger
                              : application.statusTone === "muted"
                                ? styles.statusMuted
                                : styles.statusAccent
                          }`}
                        >
                          {application.statusLabel}
                        </span>
                        {application.href ? (
                          <span className={styles.detailLink}>
                            상세 보기
                            <ArrowRightIcon className={styles.detailArrow} />
                          </span>
                        ) : null}
                      </div>
                      <strong className={styles.applicationTitle}>{application.title}</strong>
                      <p className={styles.applicationVenue}>{application.venueName}</p>
                      <p className={styles.applicationMeta}>{application.metaLabel}</p>
                    </>
                  );

                  return application.href ? (
                    <Link
                      className={styles.applicationCard}
                      href={application.href}
                      key={application.id}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className={styles.applicationCard} key={application.id}>
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <form action="/auth/signout" className={styles.logoutForm} method="post">
            <button className={styles.logoutButton} type="submit">
              로그아웃
            </button>
          </form>
        </section>
      </main>
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
