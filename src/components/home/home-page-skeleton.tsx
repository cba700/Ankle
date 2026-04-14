import { BrandLogo } from "@/components/branding/brand-logo";
import styles from "./home-page-skeleton.module.css";

export function HomePageSkeleton() {
  return (
    <div className={styles.page}>
      <BrandLogo className={styles.wordmarkLogo} priority />
    </div>
  );
}
