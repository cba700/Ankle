import {
  BadgeIcon,
  BasketIcon,
  ClockIcon,
  EyeIcon,
  GenderIcon,
  ShoeIcon,
  UsersIcon,
} from "@/components/icons";
import type { MatchDetailInfoItem } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchInfoSectionProps = {
  infoItems: MatchDetailInfoItem[];
  views: number;
};

export function MatchInfoSection({ infoItems, views }: MatchInfoSectionProps) {
  return (
    <MatchSection title="매치 정보">
      <div className={styles.infoGrid}>
        {infoItems.map((item) => (
          <div className={styles.infoCard} key={item.key}>
            <div className={styles.infoIconWrap}>{renderInfoIcon(item.key)}</div>
            <div className={styles.infoCopy}>
              <span className={styles.infoLabel}>{item.label}</span>
              <strong className={styles.infoValue}>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.viewerPill}>
        <EyeIcon className={styles.viewerIcon} />
        {views}명이 보고 있어요
      </div>
    </MatchSection>
  );
}

function renderInfoIcon(key: MatchDetailInfoItem["key"]) {
  switch (key) {
    case "level":
      return <BadgeIcon className={styles.infoIcon} />;
    case "gender":
      return <GenderIcon className={styles.infoIcon} />;
    case "duration":
      return <ClockIcon className={styles.infoIcon} />;
    case "format":
      return <BasketIcon className={styles.infoIcon} />;
    case "headcount":
      return <UsersIcon className={styles.infoIcon} />;
    case "shoes":
      return <ShoeIcon className={styles.infoIcon} />;
    default:
      return <BadgeIcon className={styles.infoIcon} />;
  }
}

