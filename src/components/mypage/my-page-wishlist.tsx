"use client";

import { useState } from "react";
import type { WishlistMatch } from "@/lib/wishlist";
import { buildLoginHref } from "@/lib/auth/redirect";
import { BrandLogo } from "@/components/branding/brand-logo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HeartIcon,
} from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-wishlist.module.css";

type MyPageWishlistProps = {
  initialIsAdmin: boolean;
  matches: WishlistMatch[];
};

type WishlistActionResponse =
  | {
      code?: string;
    }
  | null;

export function MyPageWishlist({
  initialIsAdmin,
  matches,
}: MyPageWishlistProps) {
  const [wishlistMatches, setWishlistMatches] = useState(matches);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);

  async function handleRemove(matchId: string) {
    if (pendingMatchId) {
      return;
    }

    setPendingMatchId(matchId);
    setFeedbackMessage(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/wishlist`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as WishlistActionResponse;

      if (response.ok) {
        setWishlistMatches((current) => current.filter((match) => match.id !== matchId));
        setFeedbackMessage("관심 매치에서 제거했어요.");
        return;
      }

      if (response.status === 401 || payload?.code === "AUTH_REQUIRED") {
        window.location.href = buildLoginHref("/mypage/wishlist");
        return;
      }

      if (
        response.status === 503 ||
        payload?.code === "SUPABASE_NOT_CONFIGURED"
      ) {
        window.location.href = buildLoginHref(
          "/mypage/wishlist",
          "supabase_not_configured",
        );
        return;
      }

      setFeedbackMessage("관심 매치 해제에 실패했습니다. 다시 시도해 주세요.");
    } catch {
      setFeedbackMessage("관심 매치 해제에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setPendingMatchId(null);
    }
  }

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
              <HeartIcon className={styles.heroBadgeIcon} filled />
              Match Wishlist
            </span>
            <p className={styles.heroEyebrow}>관심 매치</p>
            <h1 className={styles.heroTitle}>{wishlistMatches.length}</h1>
            <p className={styles.heroDescription}>
              마음에 둔 매치를 한곳에서 모아 보고, 바로 상세 화면으로 다시 이동할 수 있습니다.
              공개 중인 앞으로의 매치만 목록에 유지됩니다.
            </p>
            {feedbackMessage ? (
              <p className={styles.feedbackMessage}>{feedbackMessage}</p>
            ) : null}
          </div>
        </section>

        <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>저장한 목록</p>
              <h2 className={baseStyles.sectionTitle}>관심 매치</h2>
            </div>
            <span className={baseStyles.sectionCount}>{wishlistMatches.length}건</span>
          </div>

          {wishlistMatches.length === 0 ? (
            <div className={baseStyles.emptyState}>
              <strong>저장한 관심 매치가 없습니다.</strong>
              <p>메인 화면에서 하트를 눌러 다시 보고 싶은 매치를 저장해 보세요.</p>
              <AppLink className={baseStyles.homeLink} href="/">
                홈에서 매치 보기
              </AppLink>
            </div>
          ) : (
            <div className={baseStyles.applicationList}>
              {wishlistMatches.map((match) => {
                const content = (
                  <>
                    <div className={baseStyles.applicationTop}>
                      <span
                        className={`${baseStyles.statusBadge} ${
                          match.statusTone === "muted"
                            ? baseStyles.statusMuted
                            : baseStyles.statusAccent
                        }`}
                      >
                        {match.statusLabel}
                      </span>
                      {match.href ? (
                        <span className={baseStyles.detailLink}>
                          상세 보기
                          <ArrowRightIcon className={baseStyles.detailArrow} />
                        </span>
                      ) : null}
                    </div>
                    <p className={styles.dateTime}>{match.dateTimeLabel}</p>
                    <strong className={baseStyles.applicationTitle}>{match.title}</strong>
                    <p className={baseStyles.applicationVenue}>{match.venueName}</p>
                    <p className={baseStyles.applicationMeta}>{match.metaLabel}</p>
                    <p className={baseStyles.applicationCash}>참가비 {match.priceLabel}</p>
                  </>
                );

                return (
                  <article className={styles.wishlistCard} key={match.id}>
                    {match.href ? (
                      <AppLink
                        className={`${baseStyles.applicationCard} ${styles.wishlistContent} ${styles.wishlistLink}`}
                        href={match.href}
                      >
                        {content}
                      </AppLink>
                    ) : (
                      <div className={`${baseStyles.applicationCard} ${styles.wishlistContent}`}>
                        {content}
                      </div>
                    )}

                    <button
                      aria-label={`${match.title} 관심 매치 해제`}
                      className={styles.removeButton}
                      disabled={pendingMatchId === match.id}
                      onClick={() => {
                        void handleRemove(match.id);
                      }}
                      type="button"
                    >
                      <HeartIcon className={styles.removeIcon} filled />
                      저장 해제
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
