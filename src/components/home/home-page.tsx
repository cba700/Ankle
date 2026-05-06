import type { CalendarDate } from "@/lib/date";
import { LegalFooter } from "@/components/legal/legal-footer";
import { MatchDetailFeedbackProvider } from "@/components/match/match-detail-feedback";
import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { HomeMatchBrowser } from "./home-match-browser";
import type { HomeBannerSlide, HomeFilterState, HomeMatchRow } from "./home-types";
import styles from "./home-page.module.css";

type HomePageProps = {
  isAdmin: boolean;
  dates: CalendarDate[];
  initialFilterState: HomeFilterState;
  initialSelectedDateKey: string;
  homeBanners: HomeBannerSlide[];
  rows: HomeMatchRow[];
};

export function HomePage({
  isAdmin,
  dates,
  homeBanners,
  initialFilterState,
  initialSelectedDateKey,
  rows,
}: HomePageProps) {
  return (
    <MatchDetailFeedbackProvider>
      <div className={styles.page}>
        <HomeHeader isAdmin={isAdmin} />

        <main className={`pageShell ${styles.main}`}>
          <HomeHero banners={homeBanners} />
          <HomeMatchBrowser
            dates={dates}
            initialFilterState={initialFilterState}
            initialSelectedDateKey={initialSelectedDateKey}
            rows={rows}
          />
        </main>

        <LegalFooter />
      </div>
    </MatchDetailFeedbackProvider>
  );
}
