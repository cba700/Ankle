"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BasketIcon, CalendarIcon, ChevronDownIcon, HeartIcon, MapPinIcon, UsersIcon } from "@/components/icons";
import type { CalendarDate } from "@/lib/date";
import { getParticipantSummary, getPriceLabel, type MatchRecord } from "@/lib/matches";
import styles from "./home-page.module.css";

type HomePageProps = {
  matches: MatchRecord[];
  dates: CalendarDate[];
};

const FILTER_ITEMS = ["내 지역", "마감 가리기", "저녁 매치", "혜택", "성별", "레벨"];

export function HomePage({ matches, dates }: HomePageProps) {
  const [selectedDateKey, setSelectedDateKey] = useState(dates[0]?.key ?? "");
  const [likedMatches, setLikedMatches] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<string[]>(["내 지역"]);
  const dateScrollerRef = useRef<HTMLDivElement>(null);

  const selectedDate = dates.find((date) => date.key === selectedDateKey) ?? dates[0];
  const visibleMatches = matches.filter((match) => match.dateKey === selectedDateKey);

  function scrollDates(direction: "prev" | "next") {
    const container = dateScrollerRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "prev" ? -420 : 420,
      behavior: "smooth",
    });
  }

  function toggleLike(matchId: string) {
    setLikedMatches((current) => ({
      ...current,
      [matchId]: !current[matchId],
    }));
  }

  function toggleFilter(filterLabel: string) {
    setActiveFilters((current) =>
      current.includes(filterLabel)
        ? current.filter((item) => item !== filterLabel)
        : [...current, filterLabel],
    );
  }

  return (
    <main className={styles.page}>
      <div className={`pageShell ${styles.shell}`}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark}>A</span>
            <span>
              <strong>AnkleBasket</strong>
              <small>혼자 와도 바로 뛰는 한강 농구 매치</small>
            </span>
          </Link>
          <div className={styles.topbarMeta}>서울 한강 주변 MVP</div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className="sectionLabel">
              <BasketIcon />
              오늘 뜨는 한강 농구 매치
            </p>
            <h1 className={styles.heroTitle}>혼자 와도, 바로 뛰는 농구.</h1>
            <p className={styles.heroText}>
              날짜를 고르고 원하는 매치를 확인한 뒤 상세 정보와 환불 기준까지 바로
              확인하세요. AnkleBasket은 한강 주변 코트에서 가장 빠르게 합류할 수 있는
              농구 매치 흐름을 먼저 보여줍니다.
            </p>
            <div className={styles.heroStats}>
              <div>
                <strong>14일</strong>
                <span>자동 날짜 탐색</span>
              </div>
              <div>
                <strong>서울 한강</strong>
                <span>잠실, 뚝섬, 반포 중심</span>
              </div>
              <div>
                <strong>모바일 우선</strong>
                <span>가볍게 보고 바로 이동</span>
              </div>
            </div>
            <a className={styles.heroButton} href="#matches">
              오늘 매치 보러가기
            </a>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroCourt}>
              <div className={styles.heroGlow} />
              <div className={styles.heroCourtLines} />
              <div className={styles.heroCard}>
                <span>오늘 추천 매치</span>
                <strong>잠실 선셋 밸런스 3vs3</strong>
                <p>19:30 · 잠실 한강공원 농구장 · 남녀 모두</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.dateSection}>
          <div className={styles.sectionTop}>
            <div>
              <p className="sectionLabel">
                <CalendarIcon />
                날짜 선택
              </p>
              <h2 className={styles.sectionTitle}>14일 안에서 바로 참가할 매치를 고르세요</h2>
            </div>
            <div className={styles.dateButtons}>
              <button aria-label="이전 날짜 보기" className={styles.navButton} onClick={() => scrollDates("prev")} type="button">
                <ArrowLeftIcon />
              </button>
              <button aria-label="다음 날짜 보기" className={styles.navButton} onClick={() => scrollDates("next")} type="button">
                <ArrowRightIcon />
              </button>
            </div>
          </div>

          <div className={styles.dateScroller} ref={dateScrollerRef}>
            {dates.map((date) => {
              const isActive = date.key === selectedDateKey;
              const weekdayClassName = date.isSaturday
                ? styles.weekdaySaturday
                : date.isSunday
                  ? styles.weekdaySunday
                  : "";

              return (
                <button
                  className={`${styles.dateChip} ${isActive ? styles.dateChipActive : ""}`}
                  key={date.key}
                  onClick={() => setSelectedDateKey(date.key)}
                  type="button"
                >
                  <span className={styles.dateTop}>
                    {date.month}/{date.day}
                  </span>
                  <span className={`${styles.dateBottom} ${weekdayClassName}`}>
                    {date.weekdayShort}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.matchesSection} id="matches">
          <div className={styles.matchesHeading}>
            <div>
              <p className="sectionLabel">
                <BasketIcon />
                {selectedDate.month}월 {selectedDate.day}일 {selectedDate.weekdayLong} 매치
              </p>
              <h2 className={styles.sectionTitle}>원하는 시간과 분위기의 농구를 골라보세요</h2>
            </div>
            <p className={styles.sectionNote}>
              필터는 MVP 단계에서 UI만 우선 제공하고, 구조는 이후 실제 동작과 연결합니다.
            </p>
          </div>

          <div className={styles.filterRow}>
            {FILTER_ITEMS.map((filter) => {
              const isActive = activeFilters.includes(filter);

              return (
                <button
                  className={`${styles.filterChip} ${isActive ? styles.filterChipActive : ""}`}
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  type="button"
                >
                  <span>{filter}</span>
                  <ChevronDownIcon className={styles.filterIcon} />
                </button>
              );
            })}
          </div>

          {visibleMatches.length > 0 ? (
            <div className={styles.matchList}>
              {visibleMatches.map((match) => {
                const liked = likedMatches[match.id] ?? false;

                return (
                  <article className={styles.matchCard} key={match.id}>
                    <span
                      className={`${styles.statusBadge} ${
                        match.status.kind === "confirmedSoon"
                          ? styles.statusConfirmed
                          : match.status.kind === "closingSoon"
                            ? styles.statusClosing
                            : match.status.kind === "closed"
                              ? styles.statusClosed
                              : styles.statusOpen
                      }`}
                    >
                      {match.status.label}
                    </span>
                    <button
                      aria-label={liked ? "좋아요 취소" : "좋아요"}
                      className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`}
                      onClick={() => toggleLike(match.id)}
                      type="button"
                    >
                      <HeartIcon filled={liked} />
                    </button>
                    <Link
                      aria-label={`${match.title} 상세페이지로 이동`}
                      className={styles.cardLink}
                      href={`/match/${match.slug}`}
                    />
                    <div className={styles.cardTime}>{match.time}</div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitleRow}>
                        <strong>{match.venueName}</strong>
                        <span>{match.title}</span>
                      </div>
                      <div className={styles.cardMeta}>
                        <span>
                          <MapPinIcon className={styles.inlineIcon} />
                          {match.district}
                        </span>
                        <span>
                          <UsersIcon className={styles.inlineIcon} />
                          {match.genderCondition}
                        </span>
                        <span>
                          <BasketIcon className={styles.inlineIcon} />
                          {match.format} · {match.levelRange}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardSide}>
                      <strong>{getPriceLabel(match.price)}</strong>
                      <span>{getParticipantSummary(match)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>등록된 매치가 없습니다</p>
              <span>다른 날짜를 선택하거나 다음 주 일정을 확인해 주세요.</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

