import {
  BadgeIcon,
  BasketIcon,
  ClockIcon,
  GenderIcon,
  ShoeIcon,
  UsersIcon,
} from "@/components/icons";
import type { MatchDetailInfoItem } from "./match-detail-types";
import { MatchSection } from "./match-section";
import styles from "./match-sections.module.css";

type MatchInfoSectionProps = {
  infoItems: MatchDetailInfoItem[];
};

export function MatchInfoSection({ infoItems }: MatchInfoSectionProps) {
  return (
    <MatchSection title="매치 정보">
      <div className={styles.infoPanel}>
        <div className={styles.infoGrid}>
          {infoItems.map((item) => (
            <div className={styles.infoCard} key={item.key}>
              <div className={styles.infoIconWrap}>{renderInfoIcon(item.key)}</div>
              <div className={styles.infoCopy}>
                <strong className={styles.infoValue}>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MatchSection>
  );
}

function renderInfoIcon(key: MatchDetailInfoItem["key"]) {
  if (key === "level") {
    return <BadgeIcon className={styles.infoIcon} />;
  }

  if (key === "gender") {
    return <GenderIcon className={styles.infoIcon} />;
  }

  if (key === "duration") {
    return <ClockIcon className={styles.infoIcon} />;
  }

  if (key === "format") {
    return <BasketIcon className={styles.infoIcon} />;
  }

  if (key === "participants") {
    return <UsersIcon className={styles.infoIcon} />;
  }

  return <ShoeIcon className={styles.infoIcon} />;
}
