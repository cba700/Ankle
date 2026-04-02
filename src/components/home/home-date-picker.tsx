"use client";

import { useRef } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import type { CalendarDate } from "@/lib/date";
import styles from "./home-date-picker.module.css";

type HomeDatePickerProps = {
  dates: CalendarDate[];
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
};

export function HomeDatePicker({
  dates,
  selectedDateKey,
  onSelect,
}: HomeDatePickerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollDates(direction: "prev" | "next") {
    const container = scrollerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "prev" ? -280 : 280,
      behavior: "smooth",
    });
  }

  return (
    <section className={styles.section}>
      <button
        aria-label="이전 날짜"
        className={styles.arrowButton}
        onClick={() => scrollDates("prev")}
        type="button"
      >
        <ArrowLeftIcon className={styles.arrowIcon} />
      </button>

      <div className={styles.list} ref={scrollerRef}>
        {dates.map((date) => {
          const isActive = selectedDateKey === date.key;
          const weekdayClassName = date.isSaturday
            ? styles.saturday
            : date.isSunday
              ? styles.sunday
              : "";

          return (
            <button
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              key={date.key}
              onClick={() => onSelect(date.key)}
              type="button"
            >
              <span className={styles.monthDay}>
                {date.month}/{date.day}
              </span>
              <span className={`${styles.weekday} ${weekdayClassName}`}>{date.weekdayShort}</span>
              {date.isToday ? <span className={styles.todayTag}>오늘</span> : null}
            </button>
          );
        })}
      </div>

      <button
        aria-label="다음 날짜"
        className={styles.arrowButton}
        onClick={() => scrollDates("next")}
        type="button"
      >
        <ArrowRightIcon className={styles.arrowIcon} />
      </button>
    </section>
  );
}
