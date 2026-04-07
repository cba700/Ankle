import type { MatchDetailInfoItem } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchInfoSectionProps = {
  infoItems: MatchDetailInfoItem[];
};

export function MatchInfoSection({ infoItems }: MatchInfoSectionProps) {
  return (
    <MatchSection title="매치 정보">
      <div className={styles.infoGrid}>
        {infoItems.map((item) => (
          <div className={styles.infoCard} key={item.key}>
            <span className={styles.infoLabel}>{item.label}</span>
            <strong className={styles.infoValue}>{item.value}</strong>
          </div>
        ))}
      </div>
    </MatchSection>
  );
}
