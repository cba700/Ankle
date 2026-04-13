"use client";

import { useRef, useState } from "react";
import {
  PREFERRED_TIME_SLOT_OPTIONS,
  PREFERRED_WEEKDAY_OPTIONS,
  TEMPORARY_LEVEL_OPTIONS,
  toTemporaryLevelChoice,
  type PreferredTimeSlot,
  type PreferredWeekday,
  type TemporaryLevel,
  type TemporaryLevelChoice,
} from "@/lib/player-preferences";
import styles from "./welcome-stepper.module.css";

type WelcomeStepperProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialPreferredTimeSlots: PreferredTimeSlot[];
  initialPreferredWeekdays: PreferredWeekday[];
  initialTemporaryLevel: TemporaryLevel | null;
  nextPath: string;
};

const STEPS = [
  {
    id: "level",
    subtitle: "STEP 1",
    title: "농구 레벨을 선택해 주세요",
    description: "지금 선택한 값은 임시 레벨로 저장됩니다.",
  },
  {
    id: "weekday",
    subtitle: "STEP 2",
    title: "선호 요일을 알려주세요",
    description: "복수 선택 가능하고, 나중에 바꿀 수 있습니다.",
  },
  {
    id: "time",
    subtitle: "STEP 3",
    title: "선호 시간대를 알려주세요",
    description: "선택한 정보는 추천과 알림 기준으로 활용됩니다.",
  },
] as const;

export function WelcomeStepper({
  action,
  initialPreferredTimeSlots,
  initialPreferredWeekdays,
  initialTemporaryLevel,
  nextPath,
}: WelcomeStepperProps) {
  const submitRequestedRef = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedLevelChoice, setSelectedLevelChoice] =
    useState<TemporaryLevelChoice | null>(
      toTemporaryLevelChoice(initialTemporaryLevel),
    );
  const [selectedWeekdays, setSelectedWeekdays] = useState<PreferredWeekday[]>(
    initialPreferredWeekdays,
  );
  const [selectedTimeSlots, setSelectedTimeSlots] =
    useState<PreferredTimeSlot[]>(initialPreferredTimeSlots);

  const currentStep = STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const canMoveNext = currentStep.id !== "level" || Boolean(selectedLevelChoice);

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

  function moveNext() {
    if (!canMoveNext || isLastStep) {
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function moveBack() {
    if (isFirstStep) {
      return;
    }

    setStepIndex((current) => current - 1);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!submitRequestedRef.current) {
      event.preventDefault();
      return;
    }

    submitRequestedRef.current = false;
  }

  return (
    <form action={action} className={styles.card} onSubmit={handleSubmit}>
      <input name="nextPath" type="hidden" value={nextPath} />
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

      <div className={styles.progressRow}>
        {STEPS.map((step, index) => (
          <span
            aria-hidden="true"
            className={`${styles.progressDot} ${index <= stepIndex ? styles.progressDotActive : ""}`}
            key={step.id}
          />
        ))}
      </div>

      <header className={styles.header}>
        <span className={styles.subtitle}>{currentStep.subtitle}</span>
        <h1 className={styles.title}>{currentStep.title}</h1>
        <p className={styles.description}>{currentStep.description}</p>
      </header>

      <section className={styles.content}>
        {currentStep.id === "level" ? (
          <div className={styles.optionList}>
            {TEMPORARY_LEVEL_OPTIONS.map((option) => {
              const isSelected = selectedLevelChoice === option.choice;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.optionButton} ${isSelected ? styles.optionButtonActive : ""}`}
                  key={option.choice}
                  onClick={() => setSelectedLevelChoice(option.choice)}
                  type="button"
                >
                  <span className={styles.optionMain}>
                    <strong className={styles.optionTitle}>{option.choice}</strong>
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  </span>
                  <span className={styles.optionIndicator} aria-hidden="true">
                    {isSelected ? "선택됨" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {currentStep.id === "weekday" ? (
          <div className={styles.chipGrid}>
            {PREFERRED_WEEKDAY_OPTIONS.map((option) => {
              const isSelected = selectedWeekdays.includes(option.value);

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.chipButton} ${isSelected ? styles.chipButtonActive : ""}`}
                  key={option.value}
                  onClick={() => toggleWeekday(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {currentStep.id === "time" ? (
          <div className={styles.timeGrid}>
            {PREFERRED_TIME_SLOT_OPTIONS.map((option) => {
              const isSelected = selectedTimeSlots.includes(option.value);

              return (
                <button
                  aria-pressed={isSelected}
                  className={`${styles.timeButton} ${isSelected ? styles.optionButtonActive : ""}`}
                  key={option.value}
                  onClick={() => toggleTimeSlot(option.value)}
                  type="button"
                >
                  <span className={styles.optionMain}>
                    <strong className={styles.optionTitle}>{option.label}</strong>
                    <span className={styles.optionDescription}>
                      {option.window}
                    </span>
                  </span>
                  <span className={styles.optionIndicator} aria-hidden="true">
                    {isSelected ? "선택됨" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <footer className={styles.footer}>
        <button
          className={styles.secondaryButton}
          disabled={isFirstStep}
          onClick={moveBack}
          type="button"
        >
          이전
        </button>

        {isLastStep ? (
          <button
            className={styles.primaryButton}
            disabled={!selectedLevelChoice}
            onClick={() => {
              submitRequestedRef.current = true;
            }}
            type="submit"
          >
            완료
          </button>
        ) : (
          <button
            className={styles.primaryButton}
            disabled={!canMoveNext}
            onClick={moveNext}
            type="button"
          >
            다음
          </button>
        )}
      </footer>
    </form>
  );
}
