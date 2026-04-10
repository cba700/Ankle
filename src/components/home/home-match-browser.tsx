"use client";

import { startTransition, useState } from "react";
import type { CalendarDate } from "@/lib/date";
import { getHomeStateSearch } from "./home-route-state";
import { HomeDatePicker } from "./home-date-picker";
import { HomeFilterBar } from "./home-filter-bar";
import { HomeMatchList } from "./home-match-list";
import { useMatchWishlist } from "@/components/wishlist/use-match-wishlist";
import type { HomeMatchRow } from "./home-types";
import { HOME_FILTERS } from "./home-view-model";
import styles from "./home-page.module.css";

type HomeMatchBrowserProps = {
  dates: CalendarDate[];
  initialSelectedDateKey: string;
  initialActiveFilterIds: string[];
  rows: HomeMatchRow[];
};

export function HomeMatchBrowser({
  dates,
  initialSelectedDateKey,
  initialActiveFilterIds,
  rows,
}: HomeMatchBrowserProps) {
  const defaultDateKey = dates[0]?.key ?? "";
  const [selectedDateKey, setSelectedDateKey] = useState(initialSelectedDateKey || defaultDateKey);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(initialActiveFilterIds);
  const { pendingMatchIds, savedMatchIds, toggleMatchWishlist } = useMatchWishlist();

  const activeDateKey = dates.some((date) => date.key === selectedDateKey)
    ? selectedDateKey
    : defaultDateKey;
  const selectedDate = dates.find((date) => date.key === activeDateKey) ?? dates[0];
  const hideClosed = activeFilterIds.includes("hideClosed");
  const detailStateSearch = getHomeStateSearch({
    dateKey: activeDateKey,
    filterIds: activeFilterIds,
  });
  const visibleRows = rows.filter((row) => {
    if (row.dateKey !== activeDateKey) {
      return false;
    }

    if (hideClosed && row.isClosed) {
      return false;
    }

    return true;
  });

  function handleSelectDate(dateKey: string) {
    syncUrl(dateKey, activeFilterIds);
    startTransition(() => {
      setSelectedDateKey(dateKey);
    });
  }

  function toggleFilter(filterId: string) {
    const nextActiveFilterIds = activeFilterIds.includes(filterId)
      ? activeFilterIds.filter((item) => item !== filterId)
      : [...activeFilterIds, filterId];

    syncUrl(activeDateKey, nextActiveFilterIds);
    startTransition(() => {
      setActiveFilterIds(nextActiveFilterIds);
    });
  }

  function syncUrl(dateKey: string, filterIds: string[]) {
    const nextSearch = getHomeStateSearch({
      dateKey,
      filterIds,
    });
    const nextUrl = `${window.location.pathname}${nextSearch}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }

  return (
    <section className={styles.browserPanel}>
      <HomeDatePicker
        dates={dates}
        onSelect={handleSelectDate}
        selectedDateKey={activeDateKey}
      />
      <HomeFilterBar
        activeFilterIds={activeFilterIds}
        items={HOME_FILTERS}
        onToggle={toggleFilter}
      />
      {selectedDate ? (
        <h2 className={styles.dateHeading}>
          {selectedDate.month}월 {selectedDate.day}일 {selectedDate.weekdayLong} 매치
        </h2>
      ) : null}
      <HomeMatchList
        detailStateSearch={detailStateSearch}
        likedMatches={savedMatchIds}
        onToggleLike={toggleMatchWishlist}
        pendingMatchIds={pendingMatchIds}
        rows={visibleRows}
      />
    </section>
  );
}
