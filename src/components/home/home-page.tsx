import type { CalendarDate } from "@/lib/date";
import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { HomeMatchBrowser } from "./home-match-browser";
import type { HomeMatchRow } from "./home-types";
import styles from "./home-page.module.css";

type HomePageProps = {
  isAdmin: boolean;
  dates: CalendarDate[];
  rows: HomeMatchRow[];
};

export function HomePage({ isAdmin, dates, rows }: HomePageProps) {
  return (
    <div className={styles.page}>
      <HomeHeader isAdmin={isAdmin} />

      <main className={`pageShell ${styles.main}`}>
        <HomeHero />
        <HomeMatchBrowser dates={dates} rows={rows} />
      </main>
    </div>
  );
}
