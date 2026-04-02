import { BasketIcon } from "@/components/icons";
import styles from "./home-floating-cta.module.css";

export function HomeFloatingCta() {
  return (
    <button className={styles.cta} type="button">
      <span className={styles.iconWrap}>
        <BasketIcon className={styles.icon} />
      </span>
      <span className={styles.copy}>
        <small>지금 회원 가입하고</small>
        <strong>원하는 매치를 찜해보세요</strong>
      </span>
    </button>
  );
}

