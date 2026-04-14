export const PLAYER_LEVEL_CATEGORIES = [
  "Basic",
  "Middle",
  "High",
  "Star",
] as const;

export const PLAYER_LEVEL_NUMBERS = ["1", "2", "3"] as const;

export const PLAYER_LEVEL_VALUES = PLAYER_LEVEL_CATEGORIES.flatMap((category) =>
  PLAYER_LEVEL_NUMBERS.map((number) => `${category} ${number}`),
);

export type PlayerLevelCategory = (typeof PLAYER_LEVEL_CATEGORIES)[number];
export type PlayerLevelNumber = (typeof PLAYER_LEVEL_NUMBERS)[number];
export type PlayerLevelValue = (typeof PLAYER_LEVEL_VALUES)[number];

export function isPlayerLevelCategory(value: string): value is PlayerLevelCategory {
  return PLAYER_LEVEL_CATEGORIES.includes(value as PlayerLevelCategory);
}

export function isPlayerLevelNumber(value: string): value is PlayerLevelNumber {
  return PLAYER_LEVEL_NUMBERS.includes(value as PlayerLevelNumber);
}

export function isPlayerLevelValue(value: string): value is PlayerLevelValue {
  return PLAYER_LEVEL_VALUES.includes(value as PlayerLevelValue);
}

export function buildPlayerLevelValue(
  category: string,
  levelNumber: string,
): PlayerLevelValue | null {
  if (!isPlayerLevelCategory(category) || !isPlayerLevelNumber(levelNumber)) {
    return null;
  }

  const value = `${category} ${levelNumber}`;
  return isPlayerLevelValue(value) ? value : null;
}

export function parsePlayerLevelValue(value: string | null | undefined) {
  if (!value || !isPlayerLevelValue(value)) {
    return null;
  }

  const [category, levelNumber] = value.split(" ");

  if (!isPlayerLevelCategory(category) || !isPlayerLevelNumber(levelNumber)) {
    return null;
  }

  return {
    category,
    levelNumber,
    value,
  };
}

export function formatPlayerLevel(value: string | null | undefined): string {
  return isPlayerLevelValue(value ?? "") ? (value ?? "미설정") : "미설정";
}

export function formatProfileGenderLabel(value: string | null | undefined): string {
  if (value === "male") {
    return "남성";
  }

  if (value === "female") {
    return "여성";
  }

  return "미설정";
}
