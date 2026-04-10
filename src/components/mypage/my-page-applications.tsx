"use client";

import { useState } from "react";
import type { MyPageApplication } from "@/lib/mypage";
import { addDays, getSeoulTodayStart, toDateKey } from "@/lib/date";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
} from "@/components/icons";
import { LegalFooter } from "@/components/legal/legal-footer";
import { AppLink } from "@/components/navigation/app-link";
import { MatchSearch } from "@/components/navigation/match-search";
import { UserHeaderMenu } from "@/components/navigation/user-header-menu";
import baseStyles from "./my-page.module.css";
import styles from "./my-page-applications.module.css";

type MyPageApplicationsProps = {
  applications: MyPageApplication[];
  initialIsAdmin: boolean;
};

type CalendarDay = {
  dateKey: string;
  day: number;
  hasApplications: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const WEEKDAY_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};
const SEOUL_FULL_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});
const SEOUL_MONTH_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
});
const SEOUL_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  weekday: "short",
});
const SEOUL_YEAR_MONTH_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
});

export function MyPageApplications({
  applications,
  initialIsAdmin,
}: MyPageApplicationsProps) {
  const applicationsByDate = groupApplicationsByDate(applications);
  const markedDateKeys = new Set(applicationsByDate.keys());
  const [currentMonthStart, setCurrentMonthStart] = useState(() =>
    getInitialMonthStart(applications),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const calendarDays = buildCalendarDays(currentMonthStart, markedDateKeys);
  const selectedApplications = selectedDateKey
    ? applicationsByDate.get(selectedDateKey) ?? []
    : [];
  const selectedDateLabel = selectedDateKey
    ? SEOUL_FULL_DATE_FORMATTER.format(parseDateKey(selectedDateKey))
    : null;

  function handleMoveMonth(direction: "prev" | "next") {
    setCurrentMonthStart((current) => addCalendarMonths(current, direction === "prev" ? -1 : 1));
    setSelectedDateKey(null);
  }

  function handleSelectDate(day: CalendarDay) {
    setSelectedDateKey(day.dateKey);

    if (!day.isCurrentMonth) {
      setCurrentMonthStart(getMonthStart(parseDateKey(day.dateKey)));
    }
  }

  return (
    <div className={styles.page}>
      <header className={baseStyles.header}>
        <div className={baseStyles.headerInner}>
          <AppLink className={baseStyles.brand} href="/">
            <span className={baseStyles.brandWord}>앵클</span>
            <span className={baseStyles.brandDot}>.</span>
          </AppLink>

          <div className={baseStyles.headerActions}>
            <MatchSearch />
            <UserHeaderMenu
              currentSection="mypage"
              initialIsAdmin={initialIsAdmin}
              initialSignedIn
            />
          </div>
        </div>
      </header>

      <main className={`pageShell ${styles.main}`}>
        <AppLink className={styles.backLink} href="/mypage">
          <ArrowLeftIcon className={styles.backIcon} />
          마이페이지로 돌아가기
        </AppLink>

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroBadge}>
              <CalendarIcon className={styles.heroBadgeIcon} />
              신청 캘린더
            </span>
            <h1 className={styles.heroTitle}>신청한 날짜별로 매치 이력을 확인하세요.</h1>
            <p className={styles.heroDescription}>
              달력의 점은 신청을 완료했던 날짜를 뜻합니다. 날짜를 누르면 그날 신청한 매치를
              오른쪽에서 한눈에 볼 수 있습니다.
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>전체 신청</span>
              <strong className={styles.heroStatValue}>{applications.length}건</strong>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>표시 날짜</span>
              <strong className={styles.heroStatValue}>{markedDateKeys.size}일</strong>
            </div>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
              <div>
                <p className={styles.cardEyebrow}>신청한 날짜 기준</p>
                <h2 className={styles.cardTitle}>{SEOUL_MONTH_FORMATTER.format(currentMonthStart)}</h2>
              </div>

              <div className={styles.calendarControls}>
                <button
                  aria-label="이전 달"
                  className={styles.calendarControl}
                  onClick={() => handleMoveMonth("prev")}
                  type="button"
                >
                  <ArrowLeftIcon className={styles.calendarControlIcon} />
                </button>
                <button
                  aria-label="다음 달"
                  className={styles.calendarControl}
                  onClick={() => handleMoveMonth("next")}
                  type="button"
                >
                  <ArrowRightIcon className={styles.calendarControlIcon} />
                </button>
              </div>
            </div>

            <div className={styles.calendarLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} />
                신청 있음
              </span>
              <span className={styles.legendItem}>날짜 선택 후 오른쪽에서 상세 확인</span>
            </div>

            <div className={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <span className={styles.weekdayCell} key={label}>
                  {label}
                </span>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {calendarDays.map((day) => {
                const isSelected = selectedDateKey === day.dateKey;

                return (
                  <button
                    aria-label={`${SEOUL_FULL_DATE_FORMATTER.format(parseDateKey(day.dateKey))}${
                      day.hasApplications ? " 신청 내역 있음" : ""
                    }`}
                    aria-pressed={isSelected}
                    className={`${styles.dayButton} ${
                      day.isCurrentMonth ? styles.dayButtonCurrentMonth : styles.dayButtonOutsideMonth
                    } ${isSelected ? styles.dayButtonSelected : ""} ${
                      day.isToday ? styles.dayButtonToday : ""
                    }`}
                    key={day.dateKey}
                    onClick={() => handleSelectDate(day)}
                    type="button"
                  >
                    <span className={styles.dayNumber}>{day.day}</span>
                    {day.hasApplications ? <span className={styles.dayDot} /> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className={`${baseStyles.applicationSection} ${styles.detailSection}`}>
            <div className={baseStyles.sectionHeading}>
              <div>
                <p className={baseStyles.sectionEyebrow}>선택한 날짜</p>
                <h2 className={baseStyles.sectionTitle}>
                  {selectedDateLabel ?? "달력에서 날짜를 선택해 주세요"}
                </h2>
              </div>
              <span className={baseStyles.sectionCount}>
                {selectedDateKey ? `${selectedApplications.length}건` : `${applications.length}건`}
              </span>
            </div>

            {applications.length === 0 ? (
              <div className={baseStyles.emptyState}>
                <strong>아직 신청한 매치가 없습니다.</strong>
                <p>메인 화면에서 원하는 매치를 찾아 첫 신청을 시작해 보세요.</p>
                <AppLink className={baseStyles.homeLink} href="/">
                  홈에서 매치 보기
                </AppLink>
              </div>
            ) : !selectedDateKey ? (
              <div className={baseStyles.emptyState}>
                <strong>보고 싶은 날짜를 달력에서 선택하세요.</strong>
                <p>점이 있는 날짜를 누르면 그날 신청한 매치와 상태를 바로 확인할 수 있습니다.</p>
              </div>
            ) : selectedApplications.length === 0 ? (
              <div className={baseStyles.emptyState}>
                <strong>선택한 날짜에 신청한 매치가 없습니다.</strong>
                <p>다른 날짜를 선택하면 해당 날짜의 신청 내역을 확인할 수 있습니다.</p>
              </div>
            ) : (
              <div className={baseStyles.applicationList}>
                {selectedApplications.map((application) => {
                  const content = (
                    <>
                      <div className={baseStyles.applicationTop}>
                        <span
                          className={`${baseStyles.statusBadge} ${
                            application.statusTone === "danger"
                              ? baseStyles.statusDanger
                              : application.statusTone === "muted"
                                ? baseStyles.statusMuted
                                : baseStyles.statusAccent
                          }`}
                        >
                          {application.statusLabel}
                        </span>
                        {application.href ? (
                          <span className={baseStyles.detailLink}>
                            상세 보기
                            <ArrowRightIcon className={baseStyles.detailArrow} />
                          </span>
                        ) : null}
                      </div>
                      <strong className={baseStyles.applicationTitle}>{application.title}</strong>
                      <p className={baseStyles.applicationVenue}>{application.venueName}</p>
                      <p className={baseStyles.applicationMeta}>{application.metaLabel}</p>
                      <p className={baseStyles.applicationCash}>{application.cashLabel}</p>
                    </>
                  );

                  return application.href ? (
                    <AppLink
                      className={`${baseStyles.applicationCard} ${styles.applicationCardLink}`}
                      href={application.href}
                      key={application.id}
                    >
                      {content}
                    </AppLink>
                  ) : (
                    <div
                      className={`${baseStyles.applicationCard} ${styles.applicationCardStatic}`}
                      key={application.id}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}

function groupApplicationsByDate(applications: MyPageApplication[]) {
  const grouped = new Map<string, MyPageApplication[]>();

  for (const application of applications) {
    const items = grouped.get(application.appliedDateKey);

    if (items) {
      items.push(application);
      continue;
    }

    grouped.set(application.appliedDateKey, [application]);
  }

  return grouped;
}

function getInitialMonthStart(applications: MyPageApplication[]) {
  if (applications[0]) {
    return getMonthStart(parseDateKey(applications[0].appliedDateKey));
  }

  return getMonthStart(getSeoulTodayStart());
}

function buildCalendarDays(monthStart: Date, markedDateKeys: Set<string>): CalendarDay[] {
  const normalizedMonthStart = getMonthStart(monthStart);
  const firstWeekdayIndex =
    WEEKDAY_INDEX[SEOUL_WEEKDAY_FORMATTER.format(normalizedMonthStart)] ?? 0;
  const firstCellDate = addDays(normalizedMonthStart, -firstWeekdayIndex);
  const currentMonthKey = getYearMonthKey(normalizedMonthStart);
  const todayKey = toDateKey(getSeoulTodayStart());

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(firstCellDate, index);
    const dateKey = toDateKey(date);

    return {
      dateKey,
      day: Number.parseInt(dateKey.slice(-2), 10),
      hasApplications: markedDateKeys.has(dateKey),
      isCurrentMonth: getYearMonthKey(date) === currentMonthKey,
      isToday: dateKey === todayKey,
    };
  });
}

function getMonthStart(date: Date) {
  const { year, month } = getYearMonthParts(date);

  return createSeoulDate(year, month, 1);
}

function addCalendarMonths(date: Date, diff: number) {
  let { year, month } = getYearMonthParts(date);

  month += diff;

  while (month < 1) {
    month += 12;
    year -= 1;
  }

  while (month > 12) {
    month -= 12;
    year += 1;
  }

  return createSeoulDate(year, month, 1);
}

function getYearMonthKey(date: Date) {
  const { year, month } = getYearMonthParts(date);

  return `${year}-${String(month).padStart(2, "0")}`;
}

function getYearMonthParts(date: Date) {
  const parts = SEOUL_YEAR_MONTH_FORMATTER.formatToParts(date);
  const year = Number.parseInt(
    parts.find((part) => part.type === "year")?.value ?? "2026",
    10,
  );
  const month = Number.parseInt(
    parts.find((part) => part.type === "month")?.value ?? "01",
    10,
  );

  return { month, year };
}

function createSeoulDate(year: number, month: number, day: number) {
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`,
  );
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}
