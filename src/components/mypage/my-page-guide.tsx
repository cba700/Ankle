"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowLeftIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-guide.module.css";

type MyPageGuideProps = {
  initialIsAdmin: boolean;
};

type LevelKey = "first" | "basic" | "middle" | "high" | "star";

type LevelGuide = {
  buttonLabel: string;
  color: string;
  label: string;
  steps: Array<{
    description: string;
    details: string[];
    number: string;
    title: string;
  }>;
  summary: string;
  textColor: string;
};

const LEVEL_ORDER: LevelKey[] = ["first", "basic", "middle", "high", "star"];

const LEVELS: Record<LevelKey, LevelGuide> = {
  first: {
    label: "First",
    buttonLabel: "First",
    color: "#1a1a1a",
    textColor: "#ffffff",
    summary: "아직 레벨이 확정되지 않은 임시 단계예요.",
    steps: [
      {
        number: "0",
        title: "First",
        description: "처음 앵클 매치에 참여하는 플레이어예요.",
        details: [
          "아직 매치 데이터가 충분하지 않아 임시 레벨로 표시돼요.",
          "매치 매니저가 플레이를 확인한 뒤 적절한 레벨로 조정해요.",
          "참여 횟수가 쌓이면 Basic, Middle, High 중 하나로 분류돼요.",
        ],
      },
    ],
  },
  basic: {
    label: "Basic",
    buttonLabel: "Basic",
    color: "#fed356",
    textColor: "#111111",
    summary: "농구에 익숙해지는 과정이에요.",
    steps: [
      {
        number: "1",
        title: "Basic 1",
        description: "농구를 처음 시작해요.",
        details: [
          "아직 공을 다루는 것이 익숙하지 않고, 규칙에 대한 이해가 부족할 수 있어요.",
          "패스, 드리블, 슛을 시도하지만 정확도와 안정성이 부족할 수 있어요.",
          "매치 참여 시 주변의 도움과 배려가 필요한 단계예요.",
        ],
      },
      {
        number: "2",
        title: "Basic 2",
        description: "패스를 하려고 노력하지만 아직 어려워요.",
        details: [
          "가벼운 패스와 드리블은 시도할 수 있어요.",
          "압박을 받으면 판단이 늦어지고 실수가 늘어날 수 있어요.",
          "수비 위치 선정과 공이 없을 때 움직임은 아직 익숙하지 않아요.",
        ],
      },
      {
        number: "3",
        title: "Basic 3",
        description: "기본적인 플레이 흐름을 조금씩 이해해요.",
        details: [
          "간단한 패스, 드리블, 슛을 시도할 수 있어요.",
          "가벼운 경기 흐름에는 참여할 수 있지만 빠른 템포는 어려울 수 있어요.",
          "공이 없을 때의 움직임과 수비 판단은 아직 제한적이에요.",
        ],
      },
    ],
  },
  middle: {
    label: "Middle",
    buttonLabel: "Middle",
    color: "#0a76fb",
    textColor: "#ffffff",
    summary: "기본적인 경기 운영과 팀플레이가 가능해요.",
    steps: [
      {
        number: "1",
        title: "Middle 1",
        description: "가벼운 견제 속에서 플레이가 가능해요.",
        details: [
          "기본적인 패스와 드리블, 슛이 가능해요.",
          "수비가 붙어도 간단한 판단을 할 수 있어요.",
          "다만 압박이 강해지면 실수가 늘어날 수 있어요.",
        ],
      },
      {
        number: "2",
        title: "Middle 2",
        description: "일반적인 매치 흐름에 안정적으로 참여해요.",
        details: [
          "팀원 위치를 보고 패스 선택을 할 수 있어요.",
          "공격과 수비 전환 상황을 어느 정도 이해해요.",
          "공이 없을 때도 위치를 잡으려는 움직임이 있어요.",
        ],
      },
      {
        number: "3",
        title: "Middle 3",
        description: "경기 안에서 영향력을 만들 수 있어요.",
        details: [
          "기본기가 안정적이고 상황 판단이 빠른 편이에요.",
          "패스, 돌파, 슛 중 상황에 맞는 선택을 할 수 있어요.",
          "팀플레이를 이해하고 경기 흐름에 기여할 수 있어요.",
        ],
      },
    ],
  },
  high: {
    label: "High",
    buttonLabel: "High",
    color: "#ee021e",
    textColor: "#ffffff",
    summary: "빠른 템포와 강한 압박 속에서도 플레이가 가능해요.",
    steps: [
      {
        number: "1",
        title: "High 1",
        description: "강한 압박 속에서도 기본 플레이가 가능해요.",
        details: [
          "상대 수비가 붙어도 패스와 드리블 선택이 가능해요.",
          "공격과 수비 전환 속도가 빠른 편이에요.",
          "팀 안에서 확실한 역할을 수행할 수 있어요.",
        ],
      },
      {
        number: "2",
        title: "High 2",
        description: "경기 흐름을 주도할 수 있어요.",
        details: [
          "공격 전개와 수비 위치 조율에 적극적으로 관여해요.",
          "개인 능력뿐 아니라 팀 전체 흐름을 볼 수 있어요.",
          "대부분의 일반 매치에서 상위권 수준의 영향력을 보여요.",
        ],
      },
      {
        number: "3",
        title: "High 3",
        description: "높은 수준의 매치에서도 안정적으로 활약해요.",
        details: [
          "빠른 판단, 강한 압박 대응, 안정적인 마무리가 가능해요.",
          "팀의 중심 역할을 맡을 수 있어요.",
          "숙련자 중심 매치에서도 충분히 경쟁력이 있어요.",
        ],
      },
    ],
  },
  star: {
    label: "Star",
    buttonLabel: "Star",
    color: "#fefefe",
    textColor: "#111111",
    summary: "앵클에서 가장 높은 수준의 플레이어예요.",
    steps: [
      {
        number: "★",
        title: "Star",
        description: "매치 전체에 큰 영향력을 주는 최상위 레벨이에요.",
        details: [
          "기술, 판단, 체력, 경기 이해도가 모두 높은 수준이에요.",
          "팀의 흐름을 만들고 중요한 순간에 확실한 역할을 해요.",
          "상위 레벨 매치에서도 플레이 완성도가 높게 나타나요.",
        ],
      },
    ],
  },
};

export function MyPageGuide({ initialIsAdmin }: MyPageGuideProps) {
  const [selectedLevel, setSelectedLevel] = useState<LevelKey>("first");
  const guide = LEVELS[selectedLevel];

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <BrandLogo className={baseStyles.brandLogo} priority />
          </AppLink>

          <div className={baseStyles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={initialIsAdmin}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={`pageShell ${styles.main}`}>
        <AppLink className={styles.backLink} href="/mypage">
          <ArrowLeftIcon className={styles.backIcon} />
          마이페이지로 돌아가기
        </AppLink>

        <section className={styles.guideCard}>
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>앵클 레벨 가이드</h1>
            <p className={styles.heroDescription}>
              매치 매니저가 플레이어의 레벨을 평가하며, 매치에 자주 참여할수록 레벨이 명확해져요!
            </p>
          </div>

          <div className={styles.imageBox}>
            <img
              alt="앵클 레벨 전체 이미지"
              className={styles.levelImage}
              src="/level-guide/entire-level.png"
            />
          </div>

          <div aria-label="앵클 레벨 단계" className={styles.tabs} role="tablist">
            {LEVEL_ORDER.map((levelKey) => {
              const level = LEVELS[levelKey];
              const isSelected = selectedLevel === levelKey;
              const activeColor = levelKey === "star" ? "#111111" : level.color;

              return (
                <button
                  aria-controls="level-guide-panel"
                  aria-selected={isSelected}
                  className={`${styles.tab} ${isSelected ? styles.tabActive : ""}`}
                  id={`level-guide-tab-${levelKey}`}
                  key={levelKey}
                  onClick={() => setSelectedLevel(levelKey)}
                  role="tab"
                  style={isSelected ? { color: activeColor } : undefined}
                  type="button"
                >
                  {levelKey === "first" ? (
                    <>
                      <span className={styles.tabEn}>{level.label}</span>
                      <span className={styles.tabKo}>(임시)</span>
                    </>
                  ) : (
                    <span className={styles.tabEn}>{level.buttonLabel}</span>
                  )}
                </button>
              );
            })}
          </div>

          <section
            aria-labelledby={`level-guide-tab-${selectedLevel}`}
            className={styles.content}
            id="level-guide-panel"
            role="tabpanel"
          >
            <p className={styles.selectedLevelSummary}>{guide.summary}</p>

            <div className={styles.stepList}>
              {guide.steps.map((step) => (
                <article className={styles.stepCard} key={step.title}>
                  <div className={styles.stepHead}>
                    <span
                      className={styles.badge}
                      style={{
                        background: guide.color,
                        border: selectedLevel === "star" ? "1px solid #d1d5db" : "none",
                        color: guide.textColor,
                      }}
                    >
                      {step.number}
                    </span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                  </div>

                  <p className={styles.stepDescription}>{step.description}</p>

                  <div className={styles.detailList}>
                    {step.details.map((detail) => (
                      <p className={styles.detail} key={`${step.title}-${detail}`}>
                        {detail}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
