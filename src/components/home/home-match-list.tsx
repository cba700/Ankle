import { AppLink } from "@/components/navigation/app-link";
import { HeartIcon } from "@/components/icons";
import type { HomeMatchRow } from "./home-types";
import styles from "./home-match-list.module.css";

type HomeMatchListProps = {
  detailStateSearch: string;
  rows: HomeMatchRow[];
  likedMatches: Record<string, boolean>;
  onToggleLike: (matchId: string) => Promise<boolean | undefined>;
  pendingMatchIds: Record<string, boolean>;
};

export function HomeMatchList({
  detailStateSearch,
  rows,
  likedMatches,
  onToggleLike,
  pendingMatchIds,
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
        const isPending = pendingMatchIds[row.id] ?? false;

        return (
          <article className={styles.row} key={row.id}>
            <AppLink
              className={styles.rowLink}
              href={`/match/${row.publicId}${detailStateSearch}`}
              prefetch={false}
            >
              <div className={styles.topRow}>
                <div className={styles.topMeta}>
                  <div className={`${styles.timeWrap} ${row.isUrgent ? styles.timeUrgent : ""}`}>
                    {row.isUrgent ? <span className={styles.urgentDot} /> : null}
                    <span className={styles.time}>{row.time}</span>
                  </div>
                  {row.statusTone === "open" ? null : (
                    <span
                      className={`${styles.statusBadge} ${
                        row.statusTone === "danger"
                          ? styles.statusDanger
                          : row.statusTone === "accent"
                            ? styles.statusAccent
                            : styles.statusNeutral
                      }`}
                    >
                      {row.statusLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.infoColumn}>
                <div className={styles.titleRow}>
                  <strong className={styles.matchTitle}>{row.venueName}</strong>
                  {row.isNew ? <span className={styles.newTag}>N</span> : null}
                </div>
                <p className={styles.metaRow}>{row.meta}</p>
              </div>
            </AppLink>

            <button
              aria-label={liked ? "관심 매치 해제" : "관심 매치 저장"}
              className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`}
              disabled={isPending}
              onClick={() => {
                void onToggleLike(row.id);
              }}
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
