"use client";

import styles from "./login-page.module.css";

export type BirthDateParts = {
  day: string;
  month: string;
  year: string;
};

type BirthDateFieldsProps = {
  disabled?: boolean;
  onChange: (nextValue: BirthDateParts) => void;
  value: BirthDateParts;
};

const MIN_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: CURRENT_YEAR - MIN_YEAR + 1 },
  (_, index) => String(CURRENT_YEAR - index),
);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

export function BirthDateFields({
  disabled = false,
  onChange,
  value,
}: BirthDateFieldsProps) {
  const dayOptions = getDayOptions(value.year, value.month);

  function handleYearChange(nextYear: string) {
    onChange(normalizeBirthDateParts({ ...value, year: nextYear }));
  }

  function handleMonthChange(nextMonth: string) {
    onChange(normalizeBirthDateParts({ ...value, month: nextMonth }));
  }

  function handleDayChange(nextDay: string) {
    onChange({
      ...value,
      day: nextDay,
    });
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>생년월일</span>
      <div className={styles.birthDateRow}>
        <label className={styles.birthDateSelectWrap}>
          <span className={styles.srOnly}>출생 연도</span>
          <select
            className={styles.textField}
            disabled={disabled}
            onChange={(event) => handleYearChange(event.target.value)}
            value={value.year}
          >
            <option value="">년</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.birthDateSelectWrap}>
          <span className={styles.srOnly}>출생 월</span>
          <select
            className={styles.textField}
            disabled={disabled}
            onChange={(event) => handleMonthChange(event.target.value)}
            value={value.month}
          >
            <option value="">월</option>
            {MONTH_OPTIONS.map((month) => (
              <option key={month} value={month}>
                {Number(month)}월
              </option>
            ))}
          </select>
        </label>

        <label className={styles.birthDateSelectWrap}>
          <span className={styles.srOnly}>출생 일</span>
          <select
            className={styles.textField}
            disabled={disabled || dayOptions.length === 0}
            onChange={(event) => handleDayChange(event.target.value)}
            value={value.day}
          >
            <option value="">일</option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {Number(day)}일
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function buildBirthDateFromParts(value: BirthDateParts) {
  if (!value.year || !value.month || !value.day) {
    return null;
  }

  return `${value.year}-${value.month}-${value.day}`;
}

export function parseBirthDateParts(value: string | null | undefined): BirthDateParts {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getEmptyBirthDateParts();
  }

  const [year, month, day] = value.split("-");

  return normalizeBirthDateParts({
    day,
    month,
    year,
  });
}

function getEmptyBirthDateParts(): BirthDateParts {
  return {
    day: "",
    month: "",
    year: "",
  };
}

function normalizeBirthDateParts(value: BirthDateParts): BirthDateParts {
  const dayOptions = getDayOptions(value.year, value.month);

  if (!value.day || dayOptions.includes(value.day)) {
    return value;
  }

  return {
    ...value,
    day: "",
  };
}

function getDayOptions(year: string, month: string) {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) {
    return [] as string[];
  }

  const daysInMonth = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10),
    0,
  ).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, "0"),
  );
}
