import type { MatchDetailRefundRow } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchRefundSectionProps = {
  refundRows: MatchDetailRefundRow[];
};

export function MatchRefundSection({ refundRows }: MatchRefundSectionProps) {
  return (
    <MatchSection collapsible defaultOpen={false} title="환불 정책">
      <div className={styles.refundTable}>
        {refundRows.map((row) => (
          <div className={styles.refundRow} key={`${row.condition}-${row.policy}`}>
            <span className={styles.refundCondition}>{row.condition}</span>
            <strong className={styles.refundPolicy}>{row.policy}</strong>
          </div>
        ))}
      </div>
    </MatchSection>
  );
}

