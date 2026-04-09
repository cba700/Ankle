"use client";

import { HomePageSkeleton } from "@/components/home/home-page-skeleton";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./route-transition.module.css";

type RouteTransitionView = "home";

type RouteTransitionContextValue = {
  beginTransition: (href: string) => void;
  isPending: boolean;
};

const MIN_VISIBLE_MS = 280;
const MAX_VISIBLE_MS = 10000;

const DEFAULT_CONTEXT_VALUE: RouteTransitionContextValue = {
  beginTransition: () => {},
  isPending: false,
};

const RouteTransitionContext = createContext<RouteTransitionContextValue>(
  DEFAULT_CONTEXT_VALUE,
);

export function RouteTransitionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;
  const [isPending, setIsPending] = useState(false);
  const [pendingView, setPendingView] = useState<RouteTransitionView | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const routeKeyAtStartRef = useRef<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  }, []);

  const finishTransition = useCallback(() => {
    clearTimers();
    startedAtRef.current = null;
    routeKeyAtStartRef.current = null;
    setIsPending(false);
    setPendingView(null);
  }, [clearTimers]);

  const beginTransition = useCallback((href: string) => {
    const nextView = getTransitionView(href);

    if (!nextView) {
      return;
    }

    clearTimers();
    startedAtRef.current = Date.now();
    routeKeyAtStartRef.current = routeKey;
    setPendingView(nextView);
    setIsPending(true);
    safetyTimerRef.current = window.setTimeout(() => {
      finishTransition();
    }, MAX_VISIBLE_MS);
  }, [clearTimers, finishTransition, routeKey]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!isPending || routeKeyAtStartRef.current === null) {
      return;
    }

    if (routeKey === routeKeyAtStartRef.current) {
      return;
    }

    const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = window.setTimeout(() => {
      finishTransition();
    }, remaining);
  }, [finishTransition, isPending, routeKey]);

  const value = useMemo(
    () => ({
      beginTransition,
      isPending,
    }),
    [beginTransition, isPending],
  );

  return (
    <RouteTransitionContext.Provider value={value}>
      {children}
      {isPending && pendingView ? (
        <div aria-hidden="true" className={styles.overlay}>
          {renderTransitionView(pendingView)}
        </div>
      ) : null}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}

function renderTransitionView(view: RouteTransitionView) {
  return view === "home" ? <HomePageSkeleton /> : null;
}

function getTransitionView(href: string): RouteTransitionView | null {
  try {
    const nextUrl = new URL(href, window.location.origin);
    const normalizedPath = nextUrl.pathname.replace(/\/$/, "") || "/";

    if (normalizedPath === "/") {
      return "home";
    }

    return null;
  } catch {
    return null;
  }
}
