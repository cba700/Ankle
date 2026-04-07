import { AppLink } from "@/components/navigation/app-link";
import { BasketIcon } from "@/components/icons";
import styles from "./home-floating-cta.module.css";

export function HomeFloatingCta() {
  return (
    <AppLink className={styles.cta} href="/login">
      <span className={styles.iconWrap}>
        <BasketIcon className={styles.icon} />
      </span>
      <span className={styles.copy}>
        <small>카카오로 바로 시작하고</small>
        <strong>원하는 매치를 찜해보세요</strong>
      </span>
    </AppLink>
  );
}
