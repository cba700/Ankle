export type CalendarDate = {
  key: string;
  month: number;
  day: number;
  weekdayShort: string;
  weekdayLong: string;
  isToday: boolean;
  isSaturday: boolean;
  isSunday: boolean;
};

const DAY = 24 * 60 * 60 * 1000;
const SEOUL_DATE_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const SEOUL_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "long",
});
const SEOUL_DATE_SHORT_LABEL_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "short",
});
const SEOUL_WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  weekday: "short",
});
const SEOUL_WEEKDAY_LONG_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  weekday: "long",
});
const SEOUL_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const SEOUL_COMPACT_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "short",
  day: "numeric",
});
const MONEY_FORMATTER = new Intl.NumberFormat("ko-KR");

function getNumericDatePart(date: Date, type: "month" | "day") {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    [type]: "numeric",
  }).formatToParts(date);

  const value = parts.find((part) => part.type === type)?.value ?? "0";
  return Number.parseInt(value, 10);
}

export function getSeoulTodayStart() {
  const parts = SEOUL_DATE_KEY_FORMATTER.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
}

export function addDays(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + DAY * days);
}

export function toDateKey(date: Date) {
  return SEOUL_DATE_KEY_FORMATTER.format(date);
}

export function formatDateLabel(date: Date) {
  return SEOUL_DATE_LABEL_FORMATTER.format(date);
}

export function formatSeoulDateShortLabel(date: Date) {
  return SEOUL_DATE_SHORT_LABEL_FORMATTER.format(date);
}

export function formatSeoulDateInput(date: Date) {
  return SEOUL_DATE_KEY_FORMATTER.format(date);
}

export function formatSeoulTime(date: Date) {
  return SEOUL_TIME_FORMATTER.format(date);
}

export function formatCompactDateLabel(date: Date) {
  return SEOUL_COMPACT_DATE_FORMATTER.format(date).replace(/\s/g, "");
}

export function getCalendarDates(total = 14): CalendarDate[] {
  const today = getSeoulTodayStart();

  return Array.from({ length: total }, (_, index) => {
    const nextDate = addDays(today, index);
    const month = getNumericDatePart(nextDate, "month");
    const day = getNumericDatePart(nextDate, "day");
    const weekdayShort = SEOUL_WEEKDAY_SHORT_FORMATTER.format(nextDate);
    const weekdayLong = SEOUL_WEEKDAY_LONG_FORMATTER.format(nextDate);

    return {
      key: toDateKey(nextDate),
      month,
      day,
      weekdayShort,
      weekdayLong,
      isToday: index === 0,
      isSaturday: weekdayShort === "토",
      isSunday: weekdayShort === "일",
    };
  });
}

export function formatMoney(amount: number) {
  return MONEY_FORMATTER.format(amount);
}
