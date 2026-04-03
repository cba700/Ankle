"use client";

import { startTransition, useState } from "react";
import type { CalendarDate } from "@/lib/date";
import { HomeDatePicker } from "./home-date-picker";
import { HomeFilterBar } from "./home-filter-bar";
import { HomeMatchList } from "./home-match-list";
import type { HomeMatchRow } from "./home-types";
import { HOME_FILTERS } from "./home-view-model";
import styles from "./home-page.module.css";

type HomeMatchBrowserProps = {
  dates: CalendarDate[];
  rows: HomeMatchRow[];
};

export function HomeMatchBrowser({ dates, rows }: HomeMatchBrowserProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(dates[0]?.key ?? "");
  const [likedMatches, setLikedMatches] = useState<Record<string, boolean>>({});
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);

  const selectedDate = dates.find((date) => date.key === selectedDateKey) ?? dates[0];
  const hideClosed = activeFilterIds.includes("hideClosed");
  const visibleRows = rows.filter((row) => {
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

  function handleSelectDate(dateKey: string) {
    startTransition(() => {
      setSelectedDateKey(dateKey);
    });
  }

  function toggleFilter(filterId: string) {
    startTransition(() => {
      setActiveFilterIds((current) =>
        current.includes(filterId)
          ? current.filter((item) => item !== filterId)
          : [...current, filterId],
      );
    });
  }

  return (
    <>
      <HomeDatePicker
        dates={dates}
        onSelect={handleSelectDate}
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
    </>
  );
}
