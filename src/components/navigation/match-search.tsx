"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PublicMatchSearchItem } from "@/lib/match-search";
import {
  filterPublicMatchSearchItems,
  normalizeSearchQuery,
} from "@/lib/match-search";
import { getHomeStateSearch, parseHomeFilterIds } from "@/components/home/home-route-state";
import { ArrowLeftIcon, SearchIcon } from "@/components/icons";
import { AppLink } from "./app-link";
import styles from "./match-search.module.css";

const HOME_FILTER_IDS = ["hideClosed", "region", "gender", "level", "shade"] as const;

type MatchSearchResponse =
  | {
      items?: PublicMatchSearchItem[];
    }
  | null;

type MatchSearchProps = {
  placeholder?: string;
};

export function MatchSearch({
  placeholder = "지역, 코트, 매치 이름으로 찾기",
}: MatchSearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHomePage = pathname === "/";
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(() =>
    isHomePage ? normalizeSearchQuery(searchParams.get("q") ?? undefined) : "",
  );
  const [items, setItems] = useState<PublicMatchSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const normalizedQuery = normalizeSearchQuery(query);
  const desktopResults = useMemo(
    () => filterPublicMatchSearchItems(items, query).slice(0, 6),
    [items, query],
  );
  const mobileResults = useMemo(
    () => filterPublicMatchSearchItems(items, query).slice(0, 8),
    [items, query],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadItems() {
      try {
        const response = await fetch("/api/matches/search");

        if (!response.ok) {
          throw new Error("MATCH_SEARCH_LOAD_FAILED");
        }

        const payload = (await response.json().catch(() => null)) as MatchSearchResponse;

        if (!isMounted) {
          return;
        }

        setItems(payload?.items ?? []);
        setIsError(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setItems([]);
        setIsError(true);
      } finally {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      }
    }

    void loadItems();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      return;
    }

    setQuery(normalizeSearchQuery(searchParams.get("q") ?? undefined));
  }, [isHomePage, searchParams]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!searchWrapRef.current?.contains(event.target as Node)) {
        setIsDesktopOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setIsDesktopOpen(false);
      setIsMobileOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    mobileInputRef.current?.focus();
  }, [isMobileOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function handleQueryChange(nextQuery: string) {
    setQuery(nextQuery);

    if (isHomePage) {
      syncHomeSearchQuery(nextQuery);
    }

    if (normalizeSearchQuery(nextQuery)) {
      setIsDesktopOpen(true);
    }
  }

  function syncHomeSearchQuery(nextQuery: string) {
    const nextSearch = getHomeStateSearch({
      dateKey: searchParams.get("date") ?? undefined,
      filterIds: parseHomeFilterIds(
        searchParams.get("filters") ?? undefined,
        HOME_FILTER_IDS,
      ),
      query: nextQuery,
    });
    const nextUrl = `${window.location.pathname}${nextSearch}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(window.history.state, "", nextUrl);
    }
  }

  function closeMobileSheet() {
    setIsMobileOpen(false);
  }

  function buildResultHref(publicId: string) {
    const detailStateSearch = getHomeStateSearch({
      dateKey: isHomePage ? searchParams.get("date") ?? undefined : undefined,
      filterIds: parseHomeFilterIds(
        isHomePage ? searchParams.get("filters") ?? undefined : undefined,
        HOME_FILTER_IDS,
      ),
      query,
    });

    return `/match/${publicId}${detailStateSearch}`;
  }

  function renderResultList(
    results: PublicMatchSearchItem[],
    {
      isMobile,
    }: {
      isMobile: boolean;
    },
  ) {
    if (!normalizedQuery) {
      return null;
    }

    if (isLoading) {
      return (
        <div className={styles.messageBox}>
          <p className={styles.messageTitle}>검색 결과를 불러오는 중입니다.</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className={styles.messageBox}>
          <p className={styles.messageTitle}>검색 결과를 불러오지 못했습니다.</p>
          <p className={styles.messageText}>잠시 후 다시 시도해 주세요.</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className={styles.messageBox}>
          <p className={styles.messageTitle}>일치하는 매치가 없습니다.</p>
          <p className={styles.messageText}>다른 지역명이나 코트 이름으로 다시 찾아보세요.</p>
        </div>
      );
    }

    return (
      <div className={styles.resultList}>
        {results.map((item) => (
          <AppLink
            className={`${styles.resultItem} ${isMobile ? styles.resultItemMobile : ""}`}
            href={buildResultHref(item.publicId)}
            key={`${item.publicId}-${item.dateKey}`}
            onClick={() => {
              setIsDesktopOpen(false);
              closeMobileSheet();
            }}
            prefetch={false}
          >
            <div className={styles.resultTop}>
              <strong className={styles.resultTitle}>{item.title}</strong>
              <span className={`${styles.statusBadge} ${item.isClosed ? styles.statusClosed : styles.statusOpen}`}>
                {item.statusLabel}
              </span>
            </div>
            <p className={styles.resultMeta}>
              {item.dateLabel} · {item.time}
            </p>
            <p className={styles.resultMeta}>
              {item.venueName} · {item.district}
            </p>
          </AppLink>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.root} ref={searchWrapRef}>
      <div className={styles.desktopSearchWrap}>
        <label className={styles.searchField}>
          <SearchIcon className={styles.searchIcon} />
          <span className="visuallyHidden">매치 검색</span>
          <input
            className={styles.searchInput}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => setIsDesktopOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsDesktopOpen(false);
              }
            }}
            placeholder={placeholder}
            type="text"
            value={query}
          />
        </label>

        {isDesktopOpen && normalizedQuery ? (
          <div className={styles.desktopPanel}>
            {renderResultList(desktopResults, { isMobile: false })}
          </div>
        ) : null}
      </div>

      <button
        aria-label="검색 열기"
        className={styles.mobileTrigger}
        onClick={() => {
          setIsDesktopOpen(false);
          setIsMobileOpen(true);
        }}
        type="button"
      >
        <SearchIcon className={styles.mobileTriggerIcon} />
      </button>

      {isMobileOpen ? (
        <div className={styles.sheetRoot}>
          <section
            aria-label="매치 검색"
            aria-modal="true"
            className={styles.sheet}
            role="dialog"
          >
            <div className={styles.sheetHeader}>
              <div className={styles.sheetSearchField}>
                <button
                  aria-label="검색 닫기"
                  className={styles.sheetCloseButton}
                  onClick={closeMobileSheet}
                  type="button"
                >
                  <ArrowLeftIcon className={styles.backIcon} />
                </button>
                <input
                  aria-label="매치 검색"
                  className={styles.searchInput}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  placeholder={placeholder}
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                />
              </div>
            </div>

            <div className={styles.sheetBody}>{renderResultList(mobileResults, { isMobile: true })}</div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
