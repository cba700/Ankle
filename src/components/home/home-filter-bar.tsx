import { ChevronDownIcon } from "@/components/icons";
import type { HomeFilterItem } from "./home-types";
import styles from "./home-filter-bar.module.css";

type HomeFilterBarProps = {
  items: HomeFilterItem[];
  activeFilterIds: string[];
  onToggle: (filterId: string) => void;
};

export function HomeFilterBar({
  items,
  activeFilterIds,
  onToggle,
}: HomeFilterBarProps) {
  return (
    <section className={styles.section}>
      <div className={styles.row}>
        {items.map((item) => {
          const isActive = activeFilterIds.includes(item.id);

          return (
            <button
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              key={item.id}
              onClick={() => onToggle(item.id)}
              type="button"
            >
              <span>{item.label}</span>
              {item.kind === "menu" ? <ChevronDownIcon className={styles.chevron} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

