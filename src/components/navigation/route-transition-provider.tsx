"use client";

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

type RouteTransitionContextValue = {
  beginTransition: () => void;
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
  }, [clearTimers]);

  const beginTransition = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    routeKeyAtStartRef.current = routeKey;
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
      {isPending ? (
        <div aria-hidden="true" className={styles.overlay}>
          <div className={styles.wordmark}>앵클</div>
        </div>
      ) : null}
    </RouteTransitionContext.Provider>
  );
}

export function useRouteTransition() {
  return useContext(RouteTransitionContext);
}
