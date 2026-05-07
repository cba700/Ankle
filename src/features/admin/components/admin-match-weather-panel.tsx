"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  formatSeoulDateShortLabel,
  formatSeoulTime,
} from "@/lib/date";
import type { AdminMatchWeatherData } from "@/lib/match-weather";
import ui from "./admin-ui.module.css";
import styles from "./admin-match-weather-panel.module.css";

type AdminMatchWeatherPanelProps = {
  cancelForRainAction: () => Promise<void>;
  checkWeatherAction: () => Promise<void>;
  sendRainAlertAction: () => Promise<void>;
  weather: AdminMatchWeatherData | null;
};

export function AdminMatchWeatherPanel({
  cancelForRainAction,
  checkWeatherAction,
  sendRainAlertAction,
  weather,
}: AdminMatchWeatherPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: "error" | "success";
  } | null>(null);

  if (!weather) {
    return null;
  }

  const gridLabel =
    weather.weatherGridNx && weather.weatherGridNy
      ? `${weather.weatherGridNx}, ${weather.weatherGridNy}`
      : "미설정";
  const precipitationLabel =
    typeof weather.lastPrecipitationMm === "number"
      ? `${formatPrecipitationAmount(weather.lastPrecipitationMm)}`
      : "-";
  const isWeatherConfigured = Boolean(weather.weatherGridNx && weather.weatherGridNy);
  const isCancelled = weather.status === "cancelled";
  const isActionDisabled = !isWeatherConfigured || isCancelled || isPending;

  const runAction = (
    action: () => Promise<void>,
    successMessage: string,
  ) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await action();
        setFeedback({
          message: successMessage,
          tone: "success",
        });
        router.refresh();
      } catch (error) {
        setFeedback({
          message: error instanceof Error ? error.message : "작업을 완료하지 못했습니다.",
          tone: "error",
        });
      }
    });
  };

  return (
    <section className={`${ui.sectionCard} ${styles.panel}`}>
      <div className={styles.header}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>강우 운영</p>
          <h2 className={styles.title}>강수 예보 점검과 공지를 여기서 처리합니다.</h2>
          <p className={styles.description}>
            기상청 격자값(nx, ny) 기준으로 매치 시간대 최대 시간당 강수량을 확인합니다.
          </p>
        </div>

        <form action={checkWeatherAction}>
          <button
            className={`${ui.button} ${ui.buttonPrimary}`}
            disabled={!isWeatherConfigured || isPending}
            onClick={(event) => {
              event.preventDefault();
              runAction(checkWeatherAction, "예보 점검을 완료했습니다.");
            }}
            type="submit"
          >
            {isPending ? "처리 중" : "예보 점검"}
          </button>
        </form>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <span className={styles.label}>기상청 격자</span>
          <strong className={styles.value}>{gridLabel}</strong>
          <span className={ui.tertiary}>{weather.venueName}</span>
        </article>

        <article className={styles.card}>
          <span className={styles.label}>마지막 점검</span>
          <strong className={styles.value}>{formatDateTimeLabel(weather.lastCheckedAt)}</strong>
          <span className={ui.tertiary}>예보 기준 {formatDateTimeLabel(weather.forecastBaseAt)}</span>
        </article>

        <article className={styles.card}>
          <span className={styles.label}>현재 최대 강수</span>
          <strong className={styles.value}>{precipitationLabel}</strong>
          <span className={ui.tertiary}>{formatMatchWindowLabel(weather.startAt, weather.endAt)}</span>
        </article>

        <article className={styles.card}>
          <span className={styles.label}>발송 상태</span>
          <strong className={styles.value}>
            {weather.rainCancelledAt
              ? "강우 취소 완료"
              : weather.rainAlertChangedSentAt
                ? "강수 알림 발송"
                : weather.rainAlertSentAt
                  ? "강수 알림 발송"
                  : "미발송"}
          </strong>
          <span className={ui.tertiary}>
            알림 {formatDateTimeLabel(weather.rainAlertChangedSentAt ?? weather.rainAlertSentAt)}
          </span>
        </article>
      </div>

      <div className={styles.actions}>
        <form action={sendRainAlertAction}>
          <button
            className={ui.button}
            disabled={isActionDisabled}
            onClick={(event) => {
              event.preventDefault();
              runAction(sendRainAlertAction, "강수 알림을 발송했습니다.");
            }}
            type="submit"
          >
            강수 알림 발송
          </button>
        </form>

        <form action={cancelForRainAction}>
          <button
            className={`${ui.button} ${ui.buttonBrand}`}
            disabled={isActionDisabled}
            onClick={(event) => {
              event.preventDefault();
              runAction(cancelForRainAction, "강수 취소를 실행했습니다.");
            }}
            type="submit"
          >
            3mm 취소 실행
          </button>
        </form>
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

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${formatSeoulDateShortLabel(date)} ${formatSeoulTime(date)}`;
}

function formatMatchWindowLabel(startAt: string, endAt: string) {
  return `${formatDateTimeLabel(startAt)} - ${formatSeoulTime(new Date(endAt))}`;
}

function formatPrecipitationAmount(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}mm`;
}
