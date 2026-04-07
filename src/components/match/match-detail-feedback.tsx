"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { MatchToast } from "./match-toast";
import type { MatchToastState, MatchToastTone } from "./match-detail-types";

type MatchDetailFeedbackContextValue = (
  message: string,
  tone?: MatchToastTone,
) => void;

const MatchDetailFeedbackContext =
  createContext<MatchDetailFeedbackContextValue | null>(null);

export function MatchDetailFeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toast, setToast] = useState<MatchToastState | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, tone: MatchToastTone = "default") {
    setToast({ message, tone });
  }

  return (
    <MatchDetailFeedbackContext.Provider value={showToast}>
      {children}
      {toast ? <MatchToast message={toast.message} tone={toast.tone} /> : null}
    </MatchDetailFeedbackContext.Provider>
  );
}

export function useMatchDetailFeedback() {
  const context = useContext(MatchDetailFeedbackContext);

  if (!context) {
    throw new Error("useMatchDetailFeedback must be used within MatchDetailFeedbackProvider");
  }

  return context;
}
