import type { AdminOverviewCard } from "../types";
import styles from "./admin-overview-cards.module.css";

export function AdminOverviewCards({ items }: { items: AdminOverviewCard[] }) {
  return (
    <section className={styles.grid}>
      {items.map((item) => (
        <article key={item.id} className={`${styles.card} ${styles[item.tone]}`}>
          <p className={styles.label}>{item.label}</p>
          <strong className={styles.value}>{item.value}</strong>
          <p className={styles.helper}>{item.helper}</p>
        </article>
      ))}
    </section>
  );
}
