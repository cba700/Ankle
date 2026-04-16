import { getAverageLevelName } from "@/lib/matches";
import type { MatchDetailDistributionItem } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchLevelSectionProps = {
  distribution: MatchDetailDistributionItem[];
};

export function MatchLevelSection({ distribution }: MatchLevelSectionProps) {
  const total = distribution.reduce((sum, item) => sum + Math.max(item.value, 0), 0);
  const averageLevel = getAverageLevelName(distribution);

  const levels = distribution.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }));

  return (
    <MatchSection title="매치 데이터">
      <div className={styles.levelList}>
        {levels.map((item) => (
          <div className={styles.levelRow} key={item.label}>
            <div className={styles.levelLabelRow}>
              <span className={styles.levelName}>{item.label}</span>
              <span className={styles.levelPct}>{item.percentage}%</span>
            </div>
            <div className={styles.levelTrack}>
              <div
                className={`${styles.levelFill} ${getToneClassName(item.tone)}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {total > 0 ? (
        <div className={styles.levelInfoBox}>
          <p className={styles.levelInfoText}>
            예상 평균 레벨은 <strong>{averageLevel}</strong> 입니다.
          </p>
        </div>
      ) : null}
    </MatchSection>
  );
}

function getToneClassName(tone: MatchDetailDistributionItem["tone"]) {
  if (tone === "basic") {
    return styles.toneBasic;
  }

  if (tone === "middle") {
    return styles.toneMiddle;
  }

  if (tone === "high") {
    return styles.toneHigh;
  }

  return styles.toneStar;
}
