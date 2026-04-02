import { BadgeIcon, BasketIcon, ClockIcon, HeartIcon, MapPinIcon } from "@/components/icons";
import type { HomeQuickMenuIcon, HomeQuickMenuItem } from "./home-types";
import styles from "./home-quick-menu.module.css";

type HomeQuickMenuProps = {
  items: HomeQuickMenuItem[];
};

export function HomeQuickMenu({ items }: HomeQuickMenuProps) {
  return (
    <section className={styles.section}>
      <div className={styles.row}>
        {items.map((item) => (
          <button className={styles.item} key={item.id} type="button">
            <span className={styles.iconWrap}>{renderQuickMenuIcon(item.icon)}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function renderQuickMenuIcon(icon: HomeQuickMenuIcon) {
  switch (icon) {
    case "beginner":
      return <BadgeIcon className={styles.icon} />;
    case "riverside":
      return <MapPinIcon className={styles.icon} />;
    case "closingSoon":
      return <ClockIcon className={styles.icon} />;
    case "wishlist":
      return <HeartIcon className={styles.icon} />;
    case "matches":
    default:
      return <BasketIcon className={styles.icon} />;
  }
}

