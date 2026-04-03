import { HOME_HERO } from "./home-view-model";
import styles from "./home-hero.module.css";

export function HomeHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.backgroundGlow} />
      <div className={styles.heroBody}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>{HOME_HERO.eyebrow}</p>
          <h1 className={styles.title}>
            {HOME_HERO.title[0]}
            <br />
            {HOME_HERO.title[1]}
          </h1>
          <p className={styles.description}>{HOME_HERO.description}</p>
        </div>

        <div className={styles.badgeCard}>
          <strong>{HOME_HERO.badgeNumber}</strong>
          <span>{HOME_HERO.badgeLabel}</span>
        </div>
      </div>
    </section>
  );
}
