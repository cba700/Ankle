import Link from "next/link";
import type { AdminMatchRow } from "../types";
import { AdminStatusBadge } from "./admin-status-badge";
import styles from "./admin-match-list.module.css";

type AdminMatchListProps = {
  heading: string;
  description: string;
  rows: AdminMatchRow[];
  ctaHref?: string;
  ctaLabel?: string;
  compact?: boolean;
};

export function AdminMatchList({
  heading,
  description,
  rows,
  ctaHref,
  ctaLabel,
  compact = false,
}: AdminMatchListProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        {ctaHref && ctaLabel ? (
          <Link className={styles.cta} href={ctaHref}>
            {ctaLabel}
          </Link>
        ) : null}
      </div>

      <div className={styles.list}>
        {rows.map((row) => (
          <article
            key={row.id}
            className={`${styles.row} ${compact ? styles.rowCompact : ""}`}
          >
            <div className={styles.rowTop}>
              <AdminStatusBadge status={row.status} />
              <div className={styles.schedule}>
                <strong>{row.dateLabel}</strong>
                <span>{row.timeLabel}</span>
              </div>
            </div>

            <div className={styles.rowBody}>
              <div className={styles.titleBlock}>
                <h3 className={styles.title}>{row.title}</h3>
                <p className={styles.subtitle}>{row.venueLabel}</p>
                <p className={styles.summary}>{row.description}</p>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>참가 현황</span>
                  <strong>{row.participantLabel}</strong>
                  <span>{row.occupancyLabel}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>참가비</span>
                  <strong>{row.priceLabel}</strong>
                  <span>{row.levelLabel}</span>
                </div>
              </div>
            </div>

            <div className={styles.rowBottom}>
              <div className={styles.tags}>
                {row.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <Link className={styles.editLink} href={row.editHref}>
                편집 화면
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
