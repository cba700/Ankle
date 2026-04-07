import { AppLink } from "@/components/navigation/app-link";
import { CopyIcon, HeartIcon, MapPinIcon } from "@/components/icons";
import styles from "./match-sidebar.module.css";

type MatchSidebarProps = {
  dateText: string;
  time: string;
  courtName: string;
  address: string;
  mapUrl: string;
  priceLabel: string;
  saved: boolean;
  applyHref: string;
  canApply: boolean;
  onCopyAddress: () => void;
  onSave: () => void;
};

export function MatchSidebar({
  dateText,
  time,
  courtName,
  address,
  mapUrl,
  priceLabel,
  saved,
  applyHref,
  canApply,
  onCopyAddress,
  onSave,
}: MatchSidebarProps) {
  return (
    <div className={styles.card}>
      <div className={styles.dateTime}>
        {dateText} {time}
      </div>
      <h2 className={styles.courtName}>{courtName}</h2>
      <p className={styles.address}>{address}</p>

      <div className={styles.linkRow}>
        <button className={styles.linkButton} onClick={onCopyAddress} type="button">
          <CopyIcon className={styles.linkIcon} />
          주소 복사
        </button>
        <a className={styles.linkButton} href={mapUrl} rel="noreferrer" target="_blank">
          <MapPinIcon className={styles.linkIcon} />
          지도 보기
        </a>
      </div>

      <div className={styles.priceBlock}>
        <span className={styles.priceLabel}>참가비</span>
        <strong>{priceLabel}</strong>
      </div>

      <div className={styles.ctaRow}>
        {canApply ? (
          <AppLink className={styles.applyButton} href={applyHref}>
            신청하기
          </AppLink>
        ) : (
          <button className={styles.applyButtonDisabled} disabled type="button">
            신청하기
          </button>
        )}
        <button
          aria-label={saved ? "관심 매치 해제" : "관심 매치 저장"}
          className={`${styles.saveButton} ${saved ? styles.saveButtonActive : ""}`}
          onClick={onSave}
          type="button"
        >
          <HeartIcon filled={saved} />
        </button>
      </div>
    </div>
  );
}
