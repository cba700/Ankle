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
        <strong>조건에 맞는 매치가 없습니다</strong>
        <p>다른 날짜를 선택하거나 적용한 필터를 조정해 보세요.</p>
      </section>
    );
  }

  return (
    <section className={styles.list}>
      {rows.map((row) => {
        const liked = likedMatches[row.id] ?? false;
        const isPending = pendingMatchIds[row.id] ?? false;
        const toneClass =
          row.statusTone === "danger"
            ? styles.toneDanger
            : row.statusTone === "accent"
              ? styles.toneAccent
              : row.statusTone === "neutral"
                ? styles.toneNeutral
                : styles.toneOpen;

        return (
          <article className={styles.row} key={row.id}>
            <AppLink
              className={styles.rowLink}
              href={`/match/${row.publicId}${detailStateSearch}`}
              prefetch={false}
            >
              <div className={styles.timeColumn}>
                <div className={styles.timeMain}>
                  <span className={`${styles.time} ${toneClass}`}>{row.time}</span>
                </div>
                <span
                  aria-hidden={row.statusTone === "open"}
                  className={`${styles.statusText} ${toneClass}`}
                >
                  {row.statusLabel}
                </span>
              </div>

              <div className={styles.infoColumn}>
                <div className={styles.titleRow}>
                  <span className={styles.matchTitle}>{row.venueName}</span>
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
