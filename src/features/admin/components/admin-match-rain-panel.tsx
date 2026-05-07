"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ui from "./admin-ui.module.css";
import styles from "./admin-match-rain-panel.module.css";

type AdminMatchRainPanelProps = {
  cancelForRainAction: () => Promise<string>;
  isCancelled: boolean;
  sendRainAlertAction: () => Promise<string>;
};

type RainActionKey = "alert" | "cancel";

export function AdminMatchRainPanel({
  cancelForRainAction,
  isCancelled,
  sendRainAlertAction,
}: AdminMatchRainPanelProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<RainActionKey | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  const isPending = pendingAction !== null;
  const isActionDisabled = isCancelled || isPending;

  const runAction = async (
    key: RainActionKey,
    action: () => Promise<string>,
    successMessage: string,
  ) => {
    setFeedback(null);
    setPendingAction(key);

    try {
      const message = await action();
      setFeedback({
        message: message || successMessage,
        tone: "success",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        message: error instanceof Error ? error.message : "작업을 완료하지 못했습니다.",
        tone: "error",
      });
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className={`${ui.sectionCard} ${styles.panel}`}>
      <div className={styles.actions}>
        <button
          className={ui.button}
          disabled={isActionDisabled}
          onClick={() => void runAction("alert", sendRainAlertAction, "강수 알림을 발송했습니다.")}
          type="button"
        >
          {pendingAction === "alert" ? "처리 중" : "강수 알림 발송"}
        </button>

        <button
          className={`${ui.button} ${ui.buttonBrand}`}
          disabled={isActionDisabled}
          onClick={() => void runAction("cancel", cancelForRainAction, "강수 취소를 실행했습니다.")}
          type="button"
        >
          {pendingAction === "cancel" ? "처리 중" : "3mm 취소 실행"}
        </button>
      </div>

      {feedback ? (
        <p
          className={`${styles.feedback} ${
            feedback.tone === "success" ? styles.feedbackSuccess : styles.feedbackError
          }`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
