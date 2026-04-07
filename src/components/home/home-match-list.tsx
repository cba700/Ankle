import { AppLink } from "@/components/navigation/app-link";
import { HeartIcon } from "@/components/icons";
import type { HomeMatchRow } from "./home-types";
import styles from "./home-match-list.module.css";

type HomeMatchListProps = {
  rows: HomeMatchRow[];
  likedMatches: Record<string, boolean>;
  onToggleLike: (matchId: string) => void;
};

export function HomeMatchList({
  rows,
  likedMatches,
  onToggleLike,
}: HomeMatchListProps) {
  if (rows.length === 0) {
    return (
      <section className={styles.emptyState}>
        <strong>등록된 매치가 없습니다</strong>
        <p>다른 날짜를 선택하거나 마감 가리기 필터를 해제해 보세요.</p>
      </section>
    );
  }

  return (
    <section className={styles.list}>
      {rows.map((row) => {
        const liked = likedMatches[row.id] ?? false;

        return (
          <article className={styles.row} key={row.id}>
            <AppLink
              className={styles.rowLink}
              href={`/match/${row.slug}`}
              prefetch={false}
            >
              <div className={styles.timeColumn}>
                <div className={`${styles.timeWrap} ${row.isUrgent ? styles.timeUrgent : ""}`}>
                  {row.isUrgent ? <span className={styles.urgentDot} /> : null}
                  <span className={styles.time}>{row.time}</span>
                </div>
                <span
                  className={`${styles.statusBadge} ${
                    row.statusTone === "danger"
                      ? styles.statusDanger
                      : row.statusTone === "accent"
                        ? styles.statusAccent
                        : row.statusTone === "open"
                          ? styles.statusOpen
                          : styles.statusNeutral
                  }`}
                >
                  {row.statusLabel}
                </span>
              </div>

              <div className={styles.infoColumn}>
                {row.badges.length > 0 ? (
                  <div className={styles.badgeRow}>
                    {row.badges.map((badge) => (
                      <span
                        className={`${styles.infoBadge} ${
                          badge.tone === "green"
                            ? styles.badgeGreen
                            : badge.tone === "blue"
                              ? styles.badgeBlue
                              : styles.badgeOrange
                        }`}
                        key={badge.label}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className={styles.venueRow}>
                  <strong>{row.venueName}</strong>
                  {row.isNew ? <span className={styles.newTag}>N</span> : null}
                </div>
                <p className={styles.matchTitle}>{row.title}</p>
                <div className={styles.metaRow}>
                  {row.meta.map((meta, index) => (
                    <span className={styles.metaItem} key={`${row.id}-${meta}`}>
                      {index > 0 ? <span className={styles.metaDot}>·</span> : null}
                      {meta}
                    </span>
                  ))}
                </div>
              </div>
            </AppLink>

            <button
              aria-label={liked ? "관심 매치 해제" : "관심 매치 저장"}
              className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`}
              onClick={() => onToggleLike(row.id)}
              type="button"
            >
              <HeartIcon filled={liked} />
            </button>
          </article>
        );
      })}
    </section>
  );
}
