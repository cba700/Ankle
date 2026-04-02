"use client";

import { useState } from "react";
import type { CalendarDate } from "@/lib/date";
import type { MatchRecord } from "@/lib/matches";
import { HomeDatePicker } from "./home-date-picker";
import { HomeFilterBar } from "./home-filter-bar";
import { HomeFloatingCta } from "./home-floating-cta";
import { HomeHeader } from "./home-header";
import { HomeHero } from "./home-hero";
import { HomeMatchList } from "./home-match-list";
import { HomeNoticeBar } from "./home-notice-bar";
import { HomeQuickMenu } from "./home-quick-menu";
import { HOME_FILTERS, HOME_NOTICE, HOME_QUICK_MENUS, HOME_TABS, buildHomeMatchRows } from "./home-view-model";
import styles from "./home-page.module.css";

type HomePageProps = {
  matches: MatchRecord[];
  dates: CalendarDate[];
};

export function HomePage({ matches, dates }: HomePageProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(dates[0]?.key ?? "");
  const [likedMatches, setLikedMatches] = useState<Record<string, boolean>>({});
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);

  const matchRows = buildHomeMatchRows(matches);
  const selectedDate = dates.find((date) => date.key === selectedDateKey) ?? dates[0];
  const hideClosed = activeFilterIds.includes("hideClosed");
  const visibleRows = matchRows.filter((row) => {
    if (row.dateKey !== selectedDateKey) {
      return false;
    }

    if (hideClosed && row.isClosed) {
      return false;
    }

    return true;
  });

  function toggleLike(matchId: string) {
    setLikedMatches((current) => ({
      ...current,
      [matchId]: !current[matchId],
    }));
  }

  function toggleFilter(filterId: string) {
    setActiveFilterIds((current) =>
      current.includes(filterId)
        ? current.filter((item) => item !== filterId)
        : [...current, filterId],
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <HomeHeader tabLabel={HOME_TABS[0]} />

        <main className={styles.main}>
          <HomeHero />
          <HomeQuickMenu items={HOME_QUICK_MENUS} />
          <HomeNoticeBar text={HOME_NOTICE} />
          <HomeDatePicker
            dates={dates}
            onSelect={setSelectedDateKey}
            selectedDateKey={selectedDateKey}
          />
          <section className={styles.dateSummary}>
            <p className={styles.dateSummaryEyebrow}>선택한 날짜</p>
            <h2 className={styles.dateSummaryTitle}>
              {selectedDate.month}월 {selectedDate.day}일 {selectedDate.weekdayLong} 매치
            </h2>
          </section>
          <HomeFilterBar
            activeFilterIds={activeFilterIds}
            items={HOME_FILTERS}
            onToggle={toggleFilter}
          />
          <HomeMatchList
            likedMatches={likedMatches}
            onToggleLike={toggleLike}
            rows={visibleRows}
          />
        </main>
      </div>

      <HomeFloatingCta />
    </div>
  );
}
