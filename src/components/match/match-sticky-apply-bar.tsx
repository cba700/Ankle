import Link from "next/link";
import styles from "./match-sticky-apply-bar.module.css";

type MatchStickyApplyBarProps = {
  priceLabel: string;
  applyHref: string;
  canApply: boolean;
};

export function MatchStickyApplyBar({
  priceLabel,
  applyHref,
  canApply,
}: MatchStickyApplyBarProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.priceBlock}>
          <strong>{priceLabel}</strong>
        </div>

        {canApply ? (
          <Link className={styles.applyButton} href={applyHref}>
            신청하기
          </Link>
        ) : (
          <button className={styles.applyButtonDisabled} disabled type="button">
            신청 마감
          </button>
        )}
      </div>
    </div>
  );
}
