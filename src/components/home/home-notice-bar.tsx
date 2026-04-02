import { BasketIcon, ArrowRightIcon } from "@/components/icons";
import styles from "./home-notice-bar.module.css";

type HomeNoticeBarProps = {
  text: string;
};

export function HomeNoticeBar({ text }: HomeNoticeBarProps) {
  return (
    <button className={styles.notice} type="button">
      <BasketIcon className={styles.noticeIcon} />
      <span className={styles.text}>{text}</span>
      <ArrowRightIcon className={styles.arrow} />
    </button>
  );
}

