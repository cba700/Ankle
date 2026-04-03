import type { CalendarDate } from "@/lib/date";
import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { HomeMatchBrowser } from "./home-match-browser";
import { HomeNoticeBar } from "./home-notice-bar";
import { HomeQuickMenu } from "./home-quick-menu";
import type { HomeMatchRow } from "./home-types";
import { HOME_NOTICE, HOME_QUICK_MENUS, HOME_TABS } from "./home-view-model";
import styles from "./home-page.module.css";

type HomePageProps = {
  isAdmin: boolean;
  dates: CalendarDate[];
  myPageHref: string;
  rows: HomeMatchRow[];
};

export function HomePage({ isAdmin, dates, myPageHref, rows }: HomePageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <HomeHeader
          isAdmin={isAdmin}
          myPageHref={myPageHref}
          tabLabel={HOME_TABS[0]}
        />

        <main className={styles.main}>
          <HomeHero />
          <HomeQuickMenu items={HOME_QUICK_MENUS} />
          <HomeNoticeBar text={HOME_NOTICE} />
          <HomeMatchBrowser dates={dates} rows={rows} />
        </main>
      </div>
    </div>
  );
}
