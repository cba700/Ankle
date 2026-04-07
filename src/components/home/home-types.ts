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

export type HomeFilterKind = "toggle" | "menu";

export type HomeFilterItem = {
  id: string;
  label: string;
  kind: HomeFilterKind;
};

export type HomeMatchBadgeTone = "green" | "blue" | "orange";

export type HomeMatchBadge = {
  label: string;
  tone: HomeMatchBadgeTone;
};

export type HomeMatchStatusTone = "neutral" | "accent" | "danger" | "open";

export type HomeMatchRow = {
  id: string;
  slug: string;
  dateKey: string;
  time: string;
  statusLabel: string;
  statusTone: HomeMatchStatusTone;
  isUrgent: boolean;
  isClosed: boolean;
  venueName: string;
  title: string;
  meta: string;
  badges: HomeMatchBadge[];
  isNew: boolean;
};
