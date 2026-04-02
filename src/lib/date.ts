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

export function getSeoulTodayStart() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
}

export function addDays(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + DAY * days);
}

export function toDateKey(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

export function formatDateLabel(date: Date) {
  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return formatter.format(date);
}

export function getCalendarDates(total = 14): CalendarDate[] {
  const today = getSeoulTodayStart();

  return Array.from({ length: total }, (_, index) => {
    const nextDate = addDays(today, index);
    const month = Number(
      new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "numeric",
      }).format(nextDate),
    );
    const day = Number(
      new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        day: "numeric",
      }).format(nextDate),
    );
    const weekdayShort = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      weekday: "short",
    }).format(nextDate);
    const weekdayLong = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      weekday: "long",
    }).format(nextDate);

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
  return new Intl.NumberFormat("ko-KR").format(amount);
}
