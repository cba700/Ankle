"use client";

import { BrandLogo } from "@/components/branding/brand-logo";
import { ArrowLeftIcon, BasketIcon } from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-guide.module.css";

type MyPageGuideProps = {
  initialIsAdmin: boolean;
};

type GuideTone = "basic" | "middle" | "high" | "star";

type GuideSection = {
  description: string;
  entries: Array<{
    details: Array<{ label: string; text: string }>;
    name: string;
    summary: string;
  }>;
  eyebrow: string;
  title: string;
  tone: GuideTone;
};

const LEVEL_STRUCTURE = [
  {
    audience: "농구를 처음 시작하는 입문자",
    grade: "Basic",
    subLevelLabel: "1 / 2 / 3",
    tone: "basic",
  },
  {
    audience: "기본기를 익혀가는 과정",
    grade: "Middle",
    subLevelLabel: "1 / 2 / 3",
    tone: "middle",
  },
  {
    audience: "실전 경험을 갖춘 플레이어",
    grade: "High",
    subLevelLabel: "1 / 2 / 3",
    tone: "high",
  },
  {
    audience: "선수 출신 또는 그에 준하는 수준",
    grade: "Star",
    subLevelLabel: "—",
    tone: "star",
  },
] as const;

const GUIDE_SECTIONS: GuideSection[] = [
  {
    description: "농구를 처음 시작하는 단계부터 기본 패스와 움직임에 익숙해지는 과정을 설명합니다.",
    eyebrow: "🟠 Basic",
    title: "농구에 친해지는 과정이에요",
    tone: "basic",
    entries: [
      {
        name: "Basic 1",
        summary: "농구를 처음 시작해요.",
        details: [
          {
            label: "전반",
            text: "아직 공을 다루지 못하고 규칙에 대한 이해가 부족해 매치 참여가 어려워요.",
          },
        ],
      },
      {
        name: "Basic 2",
        summary: "패스를 하려고 노력하지만 아직 어려워요.",
        details: [
          {
            label: "기본기",
            text: "공을 전달하려고 노력하지만 패스가 어려워요.",
          },
          {
            label: "수비",
            text: "공을 쫓아 움직이지만 공을 빼앗기 어려워요.",
          },
        ],
      },
      {
        name: "Basic 3",
        summary: "압박이 없으면 느리게 공을 주고받을 수 있어요.",
        details: [
          {
            label: "기본기",
            text: "제자리에서 기본 패스가 가능하지만 패스가 약하고 정확도가 떨어져요.",
          },
          {
            label: "압박 대응",
            text: "가벼운 압박에도 쉽게 당황하고 플레이가 어려워요.",
          },
        ],
      },
    ],
  },
  {
    description: "기본 패스와 드리블, 슛을 익혀가며 가벼운 견제 속에서 플레이 범위를 넓혀가는 구간입니다.",
    eyebrow: "🟡 Middle",
    title: "기본기를 익혀가는 과정이에요",
    tone: "middle",
    entries: [
      {
        name: "Middle 1",
        summary: "압박이 없으면 느린 템포로 패스, 드리블, 슛을 할 수 있어요.",
        details: [
          {
            label: "기본기",
            text: "기본 패스와 가벼운 슛이 가능하지만 임팩트와 정확도가 부족하고 빠른 패스는 받기 어려워요.",
          },
          {
            label: "압박 대응",
            text: "가벼운 압박에 당황하고 실수로 이어져요.",
          },
          {
            label: "수비",
            text: "상대를 따라다니며 공을 빼앗으려 하지만 위치 선정이 어렵고 자세가 어색해요.",
          },
        ],
      },
      {
        name: "Middle 2",
        summary: "가벼운 견제 속에서 플레이가 가능해요.",
        details: [
          {
            label: "기본기",
            text: "패스, 슛, 드리블이 가능하지만 임팩트와 정확도가 부족해요.",
          },
          {
            label: "압박 대응",
            text: "가벼운 압박에서 플레이가 가능하지만 정교함이 부족해요.",
          },
          {
            label: "수비",
            text: "대인 마크를 하지만 위치 선정이 어렵고 쉽게 페이크에 속아요.",
          },
          {
            label: "활동량",
            text: "체력 소모가 크고 스프린트 후 회복이 필요하며, 활동 범위가 제한적이에요.",
          },
        ],
      },
      {
        name: "Middle 3",
        summary: "가벼운 견제 속에서 영향력을 발휘해요.",
        details: [
          {
            label: "기본기",
            text: "패스, 드리블, 슛이 가능하지만 다양하게 구사하기 어려워요.",
          },
          {
            label: "압박 대응",
            text: "가벼운 압박에서 플레이가 가능하지만 중간 압박에서 실수가 늘어나요.",
          },
          {
            label: "수비",
            text: "대인 마크가 가능하지만 유기적인 팀 수비는 어려워요.",
          },
          {
            label: "활동량",
            text: "기본적인 체력을 갖추었지만 공이 없을 때 움직임이 제한적이에요.",
          },
          {
            label: "기회 창출",
            text: "느슨한 수비에서 기회를 만들 수 있어요.",
          },
        ],
      },
    ],
  },
  {
    description: "실전 경험을 바탕으로 압박 속에서도 안정감과 영향력을 보여주는 플레이어를 위한 구간입니다.",
    eyebrow: "🔴 High",
    title: "실전 경험을 갖춘 플레이어예요",
    tone: "high",
    entries: [
      {
        name: "High 1",
        summary: "가벼운 견제 속에서 영향력을 발휘하고 상대의 압박에도 플레이가 가능해요.",
        details: [
          {
            label: "기본기",
            text: "패스, 드리블, 슛이 가능해요.",
          },
          {
            label: "압박 대응",
            text: "중간 압박에서 플레이가 가능하지만 순간적이고 강한 압박에서는 플레이가 어려워요.",
          },
          {
            label: "수비",
            text: "적절한 위치 선정과 대인 마크가 가능하지만 팀 수비 판단이 때때로 어려워요.",
          },
          {
            label: "활동량",
            text: "꾸준한 활동량을 보이지만 공수 전환이 빨라지거나 매치 막바지에 활동량이 떨어져요.",
          },
          {
            label: "기회 창출",
            text: "적은 빈도로 기회를 만들어요.",
          },
        ],
      },
      {
        name: "High 2",
        summary: "상대의 압박에도 영향력을 발휘해요.",
        details: [
          {
            label: "기본기",
            text: "기본 패스, 슛, 드리블을 안정적으로 구사해요.",
          },
          {
            label: "압박 대응",
            text: "중간 압박에서 안정적인 플레이가 가능하지만 순간적이고 강한 압박에 당황하고 실수를 해요.",
          },
          {
            label: "수비",
            text: "상황에 맞게 팀 수비와 대인 마크를 구사해요.",
          },
          {
            label: "활동량",
            text: "매치 내내 공격과 수비에서 꾸준한 활동량을 유지하고 공이 없어도 필요한 움직임을 가져가요.",
          },
          {
            label: "기회 창출",
            text: "패스와 팀플레이로 여러 차례 기회를 만들어요.",
          },
        ],
      },
      {
        name: "High 3",
        summary: "상대의 압박에도 기회를 만들고 강한 압박에도 플레이가 가능해요.",
        details: [
          {
            label: "기본기",
            text: "다양한 패스, 슛, 드리블을 구사해요.",
          },
          {
            label: "압박 대응",
            text: "중간 압박에서 자유롭게 플레이가 가능하지만 순간적이고 강한 압박에서는 실수가 있어요.",
          },
          {
            label: "수비",
            text: "팀 수비와 대인 마크를 적절히 구사하고 상대의 움직임을 예측해요.",
          },
          {
            label: "활동량",
            text: "매치 내내 공격과 수비에서 꾸준한 활동량을 유지하며 스프린트 후에도 빠르게 회복해요.",
          },
          {
            label: "기회 창출",
            text: "순간적인 패스로 반복해서 기회를 만들어요.",
          },
          {
            label: "기타",
            text: "매치 분위기에 따라 플레이에 기복이 있어요.",
          },
        ],
      },
    ],
  },
  {
    description: "선수 출신 또는 그에 준하는 수준으로, 빠른 템포와 강한 압박 속에서도 경기를 주도할 수 있는 최상위 구간입니다.",
    eyebrow: "⭐ Star",
    title: "선수 출신 또는 그에 준하는 수준이에요",
    tone: "star",
    entries: [
      {
        name: "Star",
        summary: "고등학교 이상의 농구 선수 출신 또는 그에 준하는 수준의 실력을 갖췄어요.",
        details: [
          {
            label: "기본기",
            text: "다양한 패스, 슛, 드리블을 빠르고 정확하게 구사해요.",
          },
          {
            label: "압박 대응",
            text: "강한 압박과 빠른 템포의 매치에서도 매치를 장악해요.",
          },
          {
            label: "수비",
            text: "상대의 움직임과 패스를 예측하고 상대 핵심 선수를 압박하고 무력화해요.",
          },
          {
            label: "활동량",
            text: "큰 힘을 들이지 않고 적재적소에 수비를 따돌리며 움직여요.",
          },
          {
            label: "기회 창출",
            text: "정교하고 창의적인 플레이로 매치 내내 결정적인 기회를 만들어요.",
          },
          {
            label: "기타",
            text: "일반 소셜 매치에서는 실력 차이로 인해 Star 레벨의 실력을 온전히 보여주기 어려울 수 있어요.",
          },
        ],
      },
    ],
  },
];

const TONE_CLASS_NAME: Record<GuideTone, string> = {
  basic: styles.toneBasic,
  middle: styles.toneMiddle,
  high: styles.toneHigh,
  star: styles.toneStar,
};

export function MyPageGuide({ initialIsAdmin }: MyPageGuideProps) {
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

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <BasketIcon className={styles.heroBadgeIcon} />
              Level System
            </span>
            <p className={styles.heroEyebrow}>공정한 팀 구성을 위한 기준</p>
            <h1 className={styles.heroTitle}>🏀 앵클 레벨 가이드 — 농구</h1>
            <p className={styles.heroDescription}>
              앵클베스킷 레벨 시스템은 참가자들의 실력을 데이터로 기록해 공정하고 재밌는 팀
              구성을 위해 운영됩니다.
            </p>
          </div>

          <div className={styles.heroCallout}>
            <strong className={styles.heroCalloutTitle}>두 매치만 참여하면 내 앵클 레벨을 확인할 수 있어요.</strong>
            <p className={styles.heroCalloutBody}>
              숫자가 높을수록 더 높은 레벨이며, 앵클에 자주 참여할수록 내 레벨은 점점 더 정확해져요.
            </p>
          </div>
        </section>

        <section className={`${baseStyles.applicationSection} ${styles.structureSection}`}>
          <div className={baseStyles.sectionHeading}>
            <div>
              <p className={baseStyles.sectionEyebrow}>한눈에 보기</p>
              <h2 className={baseStyles.sectionTitle}>레벨 구조</h2>
            </div>
            <span className={baseStyles.sectionCount}>4개 등급</span>
          </div>

          <div className={styles.structureGrid}>
            {LEVEL_STRUCTURE.map((level) => (
              <article
                className={`${styles.structureCard} ${TONE_CLASS_NAME[level.tone]}`}
                key={level.grade}
              >
                <span className={styles.structureGrade}>{level.grade}</span>
                <span className={styles.structureMetaLabel}>세부 레벨</span>
                <strong className={styles.structureSubLevel}>{level.subLevelLabel}</strong>
                <span className={styles.structureMetaLabel}>대상</span>
                <p className={styles.structureAudience}>{level.audience}</p>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.sectionList}>
          {GUIDE_SECTIONS.map((section) => (
            <section
              className={`${styles.guideSection} ${TONE_CLASS_NAME[section.tone]}`}
              key={section.eyebrow}
            >
              <div className={styles.sectionIntro}>
                <p className={styles.sectionBadge}>{section.eyebrow}</p>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionDescription}>{section.description}</p>
              </div>

              <div className={styles.levelList}>
                {section.entries.map((entry) => (
                  <article className={styles.levelCard} key={entry.name}>
                    <div className={styles.levelHeader}>
                      <h3 className={styles.levelName}>{entry.name}</h3>
                      <p className={styles.levelSummary}>{entry.summary}</p>
                    </div>

                    <dl className={styles.levelDetails}>
                      {entry.details.map((detail) => (
                        <div className={styles.detailRow} key={`${entry.name}-${detail.label}`}>
                          <dt className={styles.detailLabel}>{detail.label}</dt>
                          <dd className={styles.detailValue}>{detail.text}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
