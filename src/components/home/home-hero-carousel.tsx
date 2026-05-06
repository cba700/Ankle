"use client";

import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import { AppLink } from "@/components/navigation/app-link";
import type { HomeBannerSlide } from "./home-types";
import styles from "./home-hero.module.css";

type HomeHeroCarouselProps = {
  banners: HomeBannerSlide[];
};

export function HomeHeroCarousel({ banners }: HomeHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBanner = banners[activeIndex] ?? banners[0];
  const hasMultipleBanners = banners.length > 1;

  useEffect(() => {
    if (activeIndex >= banners.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, banners.length]);

  if (!activeBanner) {
    return null;
  }

  function showPreviousBanner() {
    setActiveIndex((current) => (current === 0 ? banners.length - 1 : current - 1));
  }

  function showNextBanner() {
    setActiveIndex((current) => (current + 1) % banners.length);
  }

  return (
    <section
      aria-label="홈 배너"
      aria-roledescription="carousel"
      className={`${styles.hero} ${styles.carouselHero}`}
    >
      <AppLink
        aria-label={`${activeBanner.title} 페이지로 이동`}
        className={styles.bannerLink}
        href={activeBanner.href}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className={styles.heroImage} src={activeBanner.imageUrl} />
      </AppLink>

      {hasMultipleBanners ? (
        <>
          <div className={styles.carouselControls}>
            <button
              aria-label="이전 배너"
              className={styles.carouselButton}
              onClick={showPreviousBanner}
              type="button"
            >
              <ArrowLeftIcon className={styles.carouselIcon} />
            </button>
            <button
              aria-label="다음 배너"
              className={styles.carouselButton}
              onClick={showNextBanner}
              type="button"
            >
              <ArrowRightIcon className={styles.carouselIcon} />
            </button>
          </div>

          <div className={styles.carouselDots}>
            {banners.map((banner, index) => (
              <button
                aria-label={`${index + 1}번째 배너 보기`}
                aria-pressed={index === activeIndex}
                className={`${styles.carouselDot} ${
                  index === activeIndex ? styles.carouselDotActive : ""
                }`}
                key={banner.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
