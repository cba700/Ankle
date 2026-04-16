export type HomeQuickMenuIcon =
  | "matches"
  | "beginner"
  | "riverside"
  | "closingSoon"
  | "wishlist";

export type HomeQuickMenuItem = {
  id: string;
  label: string;
  icon: HomeQuickMenuIcon;
};

export type HomeFilterOption = {
  id: string;
  label: string;
};

export type HomeFilterGroupId = "districts" | "genders" | "levels";

export type HomeFilterGroup = {
  id: HomeFilterGroupId;
  label: string;
  options: HomeFilterOption[];
};

export type HomeGenderFilterKey = "male" | "female" | "mixed";

export type HomeLevelFilterKey = "basic" | "middle" | "high" | "star";

export type HomeFilterState = {
  districts: string[];
  genders: HomeGenderFilterKey[];
  hideClosed: boolean;
  levels: HomeLevelFilterKey[];
};

export type HomeMatchStatusTone = "neutral" | "accent" | "danger" | "open";

export type HomeMatchRow = {
  district: string;
  id: string;
  genderKey: HomeGenderFilterKey | null;
  isNew: boolean;
  isClosed: boolean;
  levelKey: HomeLevelFilterKey | null;
  meta: string;
  publicId: string;
  dateKey: string;
  isUrgent: boolean;
  statusLabel: string;
  statusTone: HomeMatchStatusTone;
  time: string;
  title: string;
  venueName: string;
};
