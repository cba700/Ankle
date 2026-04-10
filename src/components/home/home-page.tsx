import type { CalendarDate } from "@/lib/date";
import { LegalFooter } from "@/components/legal/legal-footer";
import { MatchDetailFeedbackProvider } from "@/components/match/match-detail-feedback";
import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { HomeMatchBrowser } from "./home-match-browser";
import type { HomeMatchRow } from "./home-types";
import styles from "./home-page.module.css";

type HomePageProps = {
  isAdmin: boolean;
  dates: CalendarDate[];
  initialSelectedDateKey: string;
  initialActiveFilterIds: string[];
  rows: HomeMatchRow[];
};

export function HomePage({
  isAdmin,
  dates,
  initialSelectedDateKey,
  initialActiveFilterIds,
  rows,
}: HomePageProps) {
  return (
    <MatchDetailFeedbackProvider>
      <div className={styles.page}>
        <HomeHeader isAdmin={isAdmin} />

        <main className={`pageShell ${styles.main}`}>
          <HomeHero />
          <HomeMatchBrowser
            dates={dates}
            initialActiveFilterIds={initialActiveFilterIds}
            initialSelectedDateKey={initialSelectedDateKey}
            rows={rows}
          />
        </main>

        <LegalFooter />
      </div>
    </MatchDetailFeedbackProvider>
  );
}
