export const TEMPORARY_LEVEL_OPTIONS = [
  {
    assignedLevel: "Basic 1",
    choice: "Basic",
    description: "농구 경험이 적거나 가볍게 즐기는 농구를 주로 해요",
  },
  {
    assignedLevel: "Middle 1",
    choice: "Middle",
    description: "동네 농구에 익숙하고 기본 룰을 알며 팀 플레이가 가능해요",
  },
  {
    assignedLevel: "High 1",
    choice: "High",
    description: "팀 플레이와 경기 운영에 익숙하고 실전 경험이 많아요",
  },
  {
    assignedLevel: "Star 1",
    choice: "Star",
    description: "고등학교 이상의 선수 출신으로 대회 및 높은 수준의 경기 경험이 있어요",
  },
] as const;

export const PREFERRED_WEEKDAY_OPTIONS = [
  { label: "월", value: "mon" },
  { label: "화", value: "tue" },
  { label: "수", value: "wed" },
  { label: "목", value: "thu" },
  { label: "금", value: "fri" },
  { label: "토", value: "sat" },
  { label: "일", value: "sun" },
] as const;

export const PREFERRED_TIME_SLOT_OPTIONS = [
  { label: "오전", value: "morning", window: "06:00 ~ 10:00" },
  { label: "점심", value: "lunch", window: "10:00 ~ 14:00" },
  { label: "오후", value: "afternoon", window: "14:00 ~ 18:00" },
  { label: "저녁", value: "evening", window: "18:00 ~ 20:00" },
] as const;

export type TemporaryLevelChoice =
  (typeof TEMPORARY_LEVEL_OPTIONS)[number]["choice"];

export type TemporaryLevel =
  (typeof TEMPORARY_LEVEL_OPTIONS)[number]["assignedLevel"];

export type PreferredWeekday =
  (typeof PREFERRED_WEEKDAY_OPTIONS)[number]["value"];

export type PreferredTimeSlot =
  (typeof PREFERRED_TIME_SLOT_OPTIONS)[number]["value"];

export function toTemporaryLevel(
  choice: string | null | undefined,
): TemporaryLevel | null {
  const matchedOption = TEMPORARY_LEVEL_OPTIONS.find(
    (option) => option.choice === choice,
  );

  return matchedOption?.assignedLevel ?? null;
}

export function toTemporaryLevelChoice(
  level: string | null | undefined,
): TemporaryLevelChoice | null {
  const matchedOption = TEMPORARY_LEVEL_OPTIONS.find(
    (option) => option.assignedLevel === level,
  );

  return matchedOption?.choice ?? null;
}

export function normalizePreferredWeekdays(values: readonly string[]) {
  return PREFERRED_WEEKDAY_OPTIONS.filter((option) =>
    values.includes(option.value),
  ).map((option) => option.value);
}

export function normalizePreferredTimeSlots(values: readonly string[]) {
  return PREFERRED_TIME_SLOT_OPTIONS.filter((option) =>
    values.includes(option.value),
  ).map((option) => option.value);
}

export function formatTemporaryLevel(level: string | null | undefined) {
  if (!level) {
    return "미설정";
  }

  return level;
}

export function formatPreferredWeekdays(values: readonly string[]) {
  const labels = PREFERRED_WEEKDAY_OPTIONS.filter((option) =>
    values.includes(option.value),
  ).map((option) => option.label);

  return labels.length > 0 ? labels.join(", ") : "미설정";
}

export function formatPreferredTimeSlots(values: readonly string[]) {
  const labels = PREFERRED_TIME_SLOT_OPTIONS.filter((option) =>
    values.includes(option.value),
  ).map((option) => option.label);

  return labels.length > 0 ? labels.join(", ") : "미설정";
}
