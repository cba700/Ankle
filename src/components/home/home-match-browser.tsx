"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import transitionStyles from "@/components/navigation/route-transition.module.css";
import { useSearchParams } from "next/navigation";
import { useMatchDetailFeedback } from "@/components/match/match-detail-feedback";
import { normalizeSearchQuery } from "@/lib/match-search";
import type { CalendarDate } from "@/lib/date";
import {
  HOME_RESET_TO_TODAY_EVENT,
  getHomeStateSearch,
} from "./home-route-state";
import { HomeDatePicker } from "./home-date-picker";
import { HomeFilterBar } from "./home-filter-bar";
import { HomeMatchList } from "./home-match-list";
import { useMatchWishlist } from "@/components/wishlist/use-match-wishlist";
import { HomePageSkeleton } from "./home-page-skeleton";
import type { HomeMatchRow } from "./home-types";
import { HOME_FILTERS } from "./home-view-model";
import styles from "./home-page.module.css";

type HomeMatchBrowserProps = {
  dates: CalendarDate[];
  initialSelectedDateKey: string;
  initialActiveFilterIds: string[];
  rows: HomeMatchRow[];
};

const RESET_SKELETON_MS = 280;

export function HomeMatchBrowser({
  dates,
  initialSelectedDateKey,
  initialActiveFilterIds,
  rows,
}: HomeMatchBrowserProps) {
  const showToast = useMatchDetailFeedback();
  const searchParams = useSearchParams();
  const defaultDateKey = dates[0]?.key ?? "";
  const [selectedDateKey, setSelectedDateKey] = useState(initialSelectedDateKey || defaultDateKey);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(initialActiveFilterIds);
  const [isResetPending, setIsResetPending] = useState(false);
  const hideResetTimerRef = useRef<number | null>(null);
  const { pendingMatchIds, savedMatchIds, toggleMatchWishlist } = useMatchWishlist();
  const normalizedQuery = normalizeSearchQuery(searchParams.get("q") ?? undefined);

  const activeDateKey = dates.some((date) => date.key === selectedDateKey)
    ? selectedDateKey
    : defaultDateKey;
  const selectedDate = dates.find((date) => date.key === activeDateKey) ?? dates[0];
  const hideClosed = activeFilterIds.includes("hideClosed");
  const detailStateSearch = getHomeStateSearch({
    filterIds: activeFilterIds,
    query: normalizedQuery,
  });
  const visibleRows = rows.filter((row) => {
    if (row.dateKey !== activeDateKey) {
      return false;
    }

    if (hideClosed && row.isClosed) {
      return false;
    }

    return true;
  }).sort((left, right) => {
    if (left.time !== right.time) {
      return left.time.localeCompare(right.time);
    }

    if (left.venueName !== right.venueName) {
      return left.venueName.localeCompare(right.venueName, "ko");
    }

    return left.publicId.localeCompare(right.publicId);
  });

  useEffect(() => {
    return () => {
      if (hideResetTimerRef.current) {
        window.clearTimeout(hideResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleResetToToday() {
      if (!defaultDateKey || activeDateKey === defaultDateKey) {
        return;
      }

      if (hideResetTimerRef.current) {
        window.clearTimeout(hideResetTimerRef.current);
      }

      setIsResetPending(true);
      startTransition(() => {
        setSelectedDateKey(defaultDateKey);
      });
      hideResetTimerRef.current = window.setTimeout(() => {
        hideResetTimerRef.current = null;
        setIsResetPending(false);
      }, RESET_SKELETON_MS);
    }

    window.addEventListener(HOME_RESET_TO_TODAY_EVENT, handleResetToToday);

    return () => {
      window.removeEventListener(HOME_RESET_TO_TODAY_EVENT, handleResetToToday);
    };
  }, [activeDateKey, defaultDateKey]);

  function handleSelectDate(dateKey: string) {
    startTransition(() => {
      setSelectedDateKey(dateKey);
    });
  }

  function toggleFilter(filterId: string) {
    const nextActiveFilterIds = activeFilterIds.includes(filterId)
      ? activeFilterIds.filter((item) => item !== filterId)
      : [...activeFilterIds, filterId];

    syncUrl(nextActiveFilterIds);
    startTransition(() => {
      setActiveFilterIds(nextActiveFilterIds);
    });
  }

  function syncUrl(filterIds: string[]) {
    const nextSearch = getHomeStateSearch({
      filterIds,
      query: normalizedQuery,
    });
    const nextUrl = `${window.location.pathname}${nextSearch}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }

  async function handleToggleLike(matchId: string) {
    try {
      const nextSaved = await toggleMatchWishlist(matchId);

      if (typeof nextSaved !== "boolean") {
        return undefined;
      }

      showToast(
        nextSaved ? "관심 매치에 담았어요." : "관심 매치에서 뺐어요.",
        "success",
      );

      return nextSaved;
    } catch {
      showToast("관심 매치 저장에 실패했습니다. 다시 시도해 주세요.", "accent");
      return undefined;
    }
  }

  return (
    <section className={styles.browserPanel}>
      {isResetPending ? (
        <div aria-hidden="true" className={transitionStyles.overlay}>
          <HomePageSkeleton />
        </div>
      ) : null}
      <div className={styles.controlsSticky}>
        <div className={styles.controlsStack}>
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
        </div>
      </div>
      {selectedDate ? (
        <h2 className={styles.dateHeading}>
          {selectedDate.month}월 {selectedDate.day}일 {selectedDate.weekdayLong} 매치
        </h2>
      ) : null}
      <HomeMatchList
        detailStateSearch={detailStateSearch}
        likedMatches={savedMatchIds}
        onToggleLike={handleToggleLike}
        pendingMatchIds={pendingMatchIds}
        rows={visibleRows}
      />
    </section>
  );
}
