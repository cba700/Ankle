"use client";

import { useState } from "react";
import {
  formatTemporaryLevel,
  PREFERRED_TIME_SLOT_OPTIONS,
  PREFERRED_WEEKDAY_OPTIONS,
  TEMPORARY_LEVEL_OPTIONS,
  toTemporaryLevelChoice,
  type PreferredTimeSlot,
  type PreferredWeekday,
  type TemporaryLevel,
  type TemporaryLevelChoice,
} from "@/lib/player-preferences";
import styles from "./profile-preferences-form.module.css";

type ProfilePreferencesFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialPreferredTimeSlots: PreferredTimeSlot[];
  initialPreferredWeekdays: PreferredWeekday[];
  initialTemporaryLevel: TemporaryLevel | null;
  nextPath?: string;
  submitLabel: string;
  subtitle?: string;
  title?: string;
};

export function ProfilePreferencesForm({
  action,
  initialPreferredTimeSlots,
  initialPreferredWeekdays,
  initialTemporaryLevel,
  nextPath,
  submitLabel,
  subtitle,
  title,
}: ProfilePreferencesFormProps) {
  const [selectedLevelChoice, setSelectedLevelChoice] =
    useState<TemporaryLevelChoice | null>(
      toTemporaryLevelChoice(initialTemporaryLevel),
    );
  const [selectedWeekdays, setSelectedWeekdays] = useState<PreferredWeekday[]>(
    initialPreferredWeekdays,
  );
  const [selectedTimeSlots, setSelectedTimeSlots] =
    useState<PreferredTimeSlot[]>(initialPreferredTimeSlots);

  function toggleWeekday(value: PreferredWeekday) {
    setSelectedWeekdays((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function toggleTimeSlot(value: PreferredTimeSlot) {
    setSelectedTimeSlots((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  const temporaryLevelLabel = formatTemporaryLevel(
    selectedLevelChoice
      ? `${selectedLevelChoice} 1`
      : initialTemporaryLevel,
  );

  return (
    <form action={action} className={styles.form}>
      {nextPath ? <input name="nextPath" type="hidden" value={nextPath} /> : null}
      {selectedLevelChoice ? (
        <input
          name="temporaryLevelChoice"
          type="hidden"
          value={selectedLevelChoice}
        />
      ) : null}
      {selectedWeekdays.map((value) => (
        <input key={value} name="preferredWeekdays" type="hidden" value={value} />
      ))}
      {selectedTimeSlots.map((value) => (
        <input key={value} name="preferredTimeSlots" type="hidden" value={value} />
      ))}

      {title || subtitle ? (
        <div className={styles.formHeader}>
          {title ? <h2 className={styles.formTitle}>{title}</h2> : null}
          {subtitle ? <p className={styles.formSubtitle}>{subtitle}</p> : null}
        </div>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelEyebrow}>배너 1</span>
          <h3 className={styles.panelTitle}>임시 레벨 설정</h3>
          <p className={styles.panelDescription}>
            원활한 매치 참여를 위해 회원님의 농구 실력을 선택해 주세요. 처음
            설정되는 레벨은 임시 레벨이며, 매치 참여 후 정식 레벨로 조정됩니다.
          </p>
        </div>

        <div className={styles.levelGrid}>
          {TEMPORARY_LEVEL_OPTIONS.map((option) => {
            const isSelected = selectedLevelChoice === option.choice;

            return (
              <button
                aria-pressed={isSelected}
                className={`${styles.levelCard} ${isSelected ? styles.optionActive : ""}`}
                key={option.choice}
                onClick={() => setSelectedLevelChoice(option.choice)}
                type="button"
              >
                <span className={styles.optionCheck} aria-hidden="true">
                  {isSelected ? "●" : "○"}
                </span>
                <div className={styles.optionCopy}>
                  <strong className={styles.optionTitle}>{option.choice}</strong>
                  <p className={styles.optionDescription}>{option.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.selectedSummary}>
          <span className={styles.summaryLabel}>현재 선택</span>
          <strong className={styles.summaryValue}>{temporaryLevelLabel}</strong>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelEyebrow}>배너 2</span>
          <h3 className={styles.panelTitle}>선호 요일 & 시간대 설정</h3>
          <p className={styles.panelDescription}>
            매치 알림을 더 똑똑하게 받아보세요. 선호하는 요일과 시간대를
            선택하면 맞춤 매치를 추천해 드릴게요.
          </p>
          <p className={styles.panelMeta}>
            복수 선택 가능 / 언제든지 마이페이지에서 변경 가능
          </p>
        </div>

        <div className={styles.preferenceGroup}>
          <strong className={styles.groupTitle}>선호 요일을 선택해 주세요</strong>
          <div className={styles.chipRow}>
            {PREFERRED_WEEKDAY_OPTIONS.map((option) => {
              const isSelected = selectedWeekdays.includes(option.value);

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.chipButton} ${isSelected ? styles.optionActive : ""}`}
                  key={option.value}
                  onClick={() => toggleWeekday(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.preferenceGroup}>
          <strong className={styles.groupTitle}>선호 시간대를 선택해 주세요</strong>
          <div className={styles.timeSlotGrid}>
            {PREFERRED_TIME_SLOT_OPTIONS.map((option) => {
              const isSelected = selectedTimeSlots.includes(option.value);

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.timeSlotCard} ${isSelected ? styles.optionActive : ""}`}
                  key={option.value}
                  onClick={() => toggleTimeSlot(option.value)}
                  type="button"
                >
                  <strong className={styles.timeSlotLabel}>{option.label}</strong>
                  <span className={styles.timeSlotWindow}>{option.window}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className={styles.panelNotice}>
          선택하신 정보는 맞춤 매치 추천 및 알림 발송에 활용됩니다.
        </p>
      </section>

      <div className={styles.actionRow}>
        <button
          className={styles.submitButton}
          disabled={!selectedLevelChoice}
          type="submit"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
