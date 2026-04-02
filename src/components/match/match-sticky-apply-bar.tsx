import styles from "./match-sticky-apply-bar.module.css";

type MatchStickyApplyBarProps = {
  priceLabel: string;
  participantSummary: string;
  onApply: () => void;
};

export function MatchStickyApplyBar({
  priceLabel,
  participantSummary,
  onApply,
}: MatchStickyApplyBarProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.priceBlock}>
          <strong>{priceLabel}</strong>
          <p>{participantSummary}</p>
        </div>

        <button className={styles.applyButton} onClick={onApply} type="button">
          신청하기
        </button>
      </div>
    </div>
  );
}
