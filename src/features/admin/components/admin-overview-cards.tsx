import type { AdminOverviewCard } from "../types";
import styles from "./admin-overview-cards.module.css";

export function AdminOverviewCards({ items }: { items: AdminOverviewCard[] }) {
  return (
    <section className={styles.grid}>
      {items.map((item) => (
        <article
          key={item.id}
          className={`${styles.card} ${
            item.tone === "danger"
              ? styles.cardDanger
              : item.tone === "accent"
                ? styles.cardAccent
                : styles.cardNeutral
          }`}
        >
          <p className={styles.label}>{item.label}</p>
          <strong className={styles.value}>{item.value}</strong>
          <p className={styles.helper}>{item.helper}</p>
        </article>
      ))}
    </section>
  );
}
