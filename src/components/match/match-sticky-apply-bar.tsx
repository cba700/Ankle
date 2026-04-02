import styles from "./match-sticky-apply-bar.module.css";

type MatchStickyApplyBarProps = {
  priceLabel: string;
  onApply: () => void;
};

export function MatchStickyApplyBar({
  priceLabel,
  onApply,
}: MatchStickyApplyBarProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.priceBlock}>
          <strong>{priceLabel}</strong>
        </div>

        <button className={styles.applyButton} onClick={onApply} type="button">
          신청하기
        </button>
      </div>
    </div>
  );
}
