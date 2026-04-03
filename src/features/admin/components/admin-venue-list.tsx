import Link from "next/link";
import type { AdminVenueRow } from "../types";
import { AdminStatusBadge } from "./admin-status-badge";
import ui from "./admin-ui.module.css";
import styles from "./admin-venue-list.module.css";

type AdminVenueListProps = {
  rows: AdminVenueRow[];
};

export function AdminVenueList({ rows }: AdminVenueListProps) {
  return (
    <section className={styles.list}>
      {rows.map((row) => (
        <article key={row.id} className={`${ui.sectionCard} ${styles.row}`}>
          <div className={styles.info}>
            <strong className={styles.name}>{row.name}</strong>
            <span className={styles.meta}>
              {row.address} · {row.matchCountLabel}
            </span>
          </div>

          <div className={styles.actions}>
            <AdminStatusBadge label={row.statusLabel} tone={row.statusTone} />
            <Link className={`${ui.button} ${ui.buttonSmall}`} href={row.editHref}>
              수정
            </Link>
            <Link
              className={`${ui.button} ${ui.buttonBrand} ${ui.buttonSmall}`}
              href={row.createMatchHref}
            >
              이 경기장으로 새 매치
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
