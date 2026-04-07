import type { MatchDetailDistributionItem } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchLevelSectionProps = {
  distribution: MatchDetailDistributionItem[];
  hint: string;
};

export function MatchLevelSection({
  distribution,
  hint,
}: MatchLevelSectionProps) {
  const maxValue = Math.max(...distribution.map((item) => item.value), 1);

  return (
    <MatchSection title="매치 데이터">
      <div className={styles.barGrid}>
        {distribution.map((item) => (
          <div className={styles.barColumn} key={item.label}>
            <div className={styles.barTrack}>
              <div
                className={`${styles.barFill} ${
                  item.tone === "basic"
                    ? styles.toneBasic
                    : item.tone === "middle"
                      ? styles.toneMiddle
                      : styles.toneHigh
                }`}
                style={{ height: `${Math.max((item.value / maxValue) * 100, 12)}%` }}
              />
            </div>
            <span className={styles.barPct}>{item.value}%</span>
            <span className={styles.barName}>{item.label}</span>
          </div>
        ))}
      </div>

      <p className={styles.levelSummary}>{hint}</p>
    </MatchSection>
  );
}
