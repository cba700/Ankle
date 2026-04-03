import Link from "next/link";
import type { AdminVenueRow } from "../types";
import styles from "./admin-venue-list.module.css";

type AdminVenueListProps = {
  heading: string;
  description: string;
  rows: AdminVenueRow[];
};

export function AdminVenueList({
  heading,
  description,
  rows,
}: AdminVenueListProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        <Link className={styles.cta} href="/admin/venues/new">
          새 경기장 추가
        </Link>
      </div>

      <div className={styles.list}>
        {rows.map((row) => (
          <article key={row.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div>
                <h3 className={styles.title}>{row.name}</h3>
                <p className={styles.subtitle}>{row.district}</p>
              </div>
              <span className={styles.status}>{row.statusLabel}</span>
            </div>

            <p className={styles.address}>{row.address}</p>

            <div className={styles.meta}>
              <span>{row.matchCountLabel}</span>
            </div>

            <div className={styles.actions}>
              <Link className={styles.secondaryLink} href={row.editHref}>
                경기장 수정
              </Link>
              <Link className={styles.primaryLink} href={row.createMatchHref}>
                이 경기장으로 새 매치
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
