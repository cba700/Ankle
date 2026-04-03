import Link from "next/link";
import { CopyIcon, EyeIcon, HeartIcon, MapPinIcon } from "@/components/icons";
import styles from "./match-sidebar.module.css";

type MatchSidebarProps = {
  dateText: string;
  time: string;
  courtName: string;
  address: string;
  mapUrl: string;
  likes: number;
  views: number;
  notice: string;
  priceLabel: string;
  saved: boolean;
  applyHref: string;
  canApply: boolean;
  onCopyAddress: () => void;
  onOpenFaq: () => void;
  onOpenCancelInfo: () => void;
  onReserve: () => void;
  onSave: () => void;
};

export function MatchSidebar({
  dateText,
  time,
  courtName,
  address,
  mapUrl,
  likes,
  views,
  notice,
  priceLabel,
  saved,
  applyHref,
  canApply,
  onCopyAddress,
  onOpenFaq,
  onOpenCancelInfo,
  onReserve,
  onSave,
}: MatchSidebarProps) {
  return (
    <div className={styles.card}>
      <div className={styles.dateTime}>
        {dateText} {time}
      </div>
      <h2 className={styles.courtName}>{courtName}</h2>

      <div className={styles.addressRow}>
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
      </div>

      <div className={styles.statsRow}>
        <span>
          <HeartIcon className={styles.statIcon} filled />
          {likes}
        </span>
        <span>
          <EyeIcon className={styles.statIcon} />
          {views}
        </span>
      </div>

      <div className={styles.notice}>{notice}</div>

      <div className={styles.priceBlock}>
        <strong>{priceLabel}</strong>
      </div>

      <button className={styles.faqButton} onClick={onOpenFaq} type="button">
        매치 전 궁금증을 먼저 확인하세요
      </button>
      <button className={styles.noticeButton} onClick={onOpenCancelInfo} type="button">
        매치가 취소될까 걱정되나요? 신청 대신 자리만 먼저 맡아보세요
      </button>

      <div className={styles.ctaRow}>
        <button
          aria-label={saved ? "관심 매치 해제" : "관심 매치 저장"}
          className={`${styles.saveIconButton} ${saved ? styles.saveIconButtonActive : ""}`}
          onClick={onSave}
          type="button"
        >
          <HeartIcon filled={saved} />
        </button>
        {canApply ? (
          <Link className={styles.secondaryButton} href={applyHref}>
            바로 신청
          </Link>
        ) : (
          <button className={styles.secondaryButtonDisabled} disabled type="button">
            신청 마감
          </button>
        )}
        <button className={styles.primaryButton} onClick={onReserve} type="button">
          자리 맡기
        </button>
      </div>
    </div>
  );
}
