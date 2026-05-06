import { HOME_HERO } from "./home-view-model";
import { HomeHeroCarousel } from "./home-hero-carousel";
import type { HomeBannerSlide } from "./home-types";
import styles from "./home-hero.module.css";

type HomeHeroProps = {
  banners: HomeBannerSlide[];
};

export function HomeHero({ banners }: HomeHeroProps) {
  if (banners.length > 0) {
    return <HomeHeroCarousel banners={banners} />;
  }

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
        </div>
      </div>
    </section>
  );
}
