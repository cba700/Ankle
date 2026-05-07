"use client";

import { Suspense, useEffect, useState } from "react";
import { HomeHeader } from "@/components/home/home-header";
import { AppLink } from "@/components/navigation/app-link";
import styles from "./about-page.module.css";

const HERO_TEXTS = [
  "친구들과",
  "나 혼자",
  "주말에",
  "휴일에",
  "퇴근하고",
  "할 일 없을 때",
  "날씨 좋은 날",
];

const HOW_STEPS = ["가입", "캐시 충전", "매치 신청", "코트에서 만나요"];

const FEATURES = [
  {
    title: "조끼 · 공 · 운영 제공",
    label: "nothing to bring",
    description: [
      "운동화 하나만 들고 코트로 오세요",
      "조끼, 공, 팀 구성, 매치 진행까지 앵클 매니저가 모두 준비합니다",
    ],
  },
  {
    title: "레벨 매칭",
    label: "similar level",
    description: [
      "비슷한 실력끼리 경기해야 농구가 재밌다",
      "앵클 레벨 시스템으로 초보도 고수도 자기 경기를 즐긴다",
    ],
  },
  {
    title: "원클릭 신청",
    label: "just a minute",
    description: [
      "단톡방 공지, 인원 확인, 장소 검색 없이",
      "날짜 선택 → 경기 확인 → 결제, 오늘 경기도 오늘 신청 가능",
    ],
  },
];

const LEVELS = [
  {
    badge: "FIRST",
    badgeClassName: "badgeFirst",
    description: "처음 앵클 매치에 참여하는 플레이어, 첫 매치 확인 후 실제 레벨 배정",
  },
  {
    badge: "BASIC",
    badgeClassName: "badgeBasic",
    description: "농구 규칙을 알고 기초 드리블·패스가 가능한 수준",
  },
  {
    badge: "MIDDLE",
    badgeClassName: "badgeMiddle",
    description: "포지션을 이해하고 팀 플레이가 가능한 수준",
  },
  {
    badge: "HIGH",
    badgeClassName: "badgeHigh",
    description: "전술 이해와 수비 능력이 갖춰진 수준",
  },
  {
    badge: "★ STAR",
    badgeClassName: "badgeStar",
    description: "클럽 · 대학 · 실업 수준 이상의 플레이어",
  },
];

export function AboutPage() {
  const [heroTextIndex, setHeroTextIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroTextIndex((currentIndex) => (currentIndex + 1) % HERO_TEXTS.length);
    }, 750);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-about-fade]");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add(styles.visible));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(styles.visible);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.headerFallback} />}>
        <HomeHeader isAdmin={false} resetBrandOnClick={false} />
      </Suspense>

      <main>
        <section className={styles.ctaTopWrap}>
          <div className={styles.ctaTop}>
            <div className={styles.ctaTopImg} aria-label="농구 매치 이미지 영역">
              {/* 실제 사진을 넣을 때 이 영역을 img 태그로 교체하세요. 예: <img src="/about-hero.jpg" alt="농구 매치" /> */}
              <div className={styles.imgPlaceholder}>
                여기에 사진을 넣어주세요
                <span>img 태그로 교체</span>
              </div>
              <div className={styles.statBadge}>
                <div className={styles.statNum}>TODAY OPEN</div>
                <div className={styles.statLabel}>오늘도 경기가 열립니다</div>
              </div>
            </div>

            <div className={`${styles.ctaTopText} ${styles.fadeUp}`} data-about-fade>
              <span className={styles.eyebrow}>농구 매칭 플랫폼 · ANKLEBASKET</span>
              <h1>
                <span>{HERO_TEXTS[heroTextIndex]}</span>
                <span>Just do</span>
                <span>ANKLE</span>
              </h1>
              <p>
                날짜와 레벨만 골라도 오늘 경기가 잡힌다
                <br />
                조끼도, 공도, 준비할 것도 없다
              </p>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        <section className={`${styles.howSection} ${styles.fadeUp}`} data-about-fade>
          <div>
            <h2 className={styles.sectionTitle}>HOW ANKLE?</h2>
            <p className={styles.sectionSub}>앵클하는 방법</p>
          </div>
          <div className={styles.steps}>
            {HOW_STEPS.map((step, index) => (
              <div className={styles.step} key={step}>
                <span className={styles.stepNum}>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step}</h3>
              </div>
            ))}
          </div>
        </section>

        <div className={styles.divider} />

        <section className={styles.featuresSection}>
          <div className={`${styles.featuresInner} ${styles.fadeUp}`} data-about-fade>
            <div>
              <h2 className={styles.sectionTitle}>WHY ANKLE?</h2>
              <p className={styles.sectionSub}>앵클인 이유</p>
            </div>
            <div className={styles.featuresGrid}>
              {FEATURES.map((feature) => (
                <article className={styles.featureCard} key={feature.title}>
                  <span className={styles.topLine} />
                  <h3>{feature.title}</h3>
                  <p className={styles.featureLabel}>{feature.label}</p>
                  <p className={styles.featureDescription}>
                    {feature.description.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.levelSection}>
          <div className={`${styles.levelHeader} ${styles.fadeUp}`} data-about-fade>
            <div>
              <h2 className={styles.sectionTitle}>LEVEL SYSTEM</h2>
            </div>
            <AppLink className={styles.textLink} href="/mypage/guide">
              가이드 보러가기 →
            </AppLink>
          </div>

          <div className={`${styles.levelRows} ${styles.fadeUp}`} data-about-fade>
            {LEVELS.map((level) => (
              <div className={styles.levelRow} key={level.badge}>
                <span
                  className={`${styles.levelBadge} ${
                    styles[level.badgeClassName as keyof typeof styles]
                  }`}
                >
                  {level.badge}
                </span>
                <p>{level.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.bottomCta}>
          <div className={`${styles.fadeUp}`} data-about-fade>
            <h2>
              오늘,
              <br />
              <span>코트에서 봐요</span>
            </h2>
            <p>운동화만 챙기세요, 나머지는 앵클이 준비합니다</p>
            <AppLink className={styles.primaryButton} href="/">
              매치 보러 가기
            </AppLink>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerLogo}>
          앵<span>클</span>
        </span>
        <p>© 2025 AnkleBasket 농구 매칭 플랫폼</p>
      </footer>
    </div>
  );
}
