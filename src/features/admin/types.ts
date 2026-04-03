export type AdminMatchStatus = "draft" | "open" | "closed" | "cancelled";
export type AdminMatchFormat = "3vs3" | "5vs5";
export type AdminVenueEntryMode = "managed" | "manual";
export type AdminMatchLevelPreset = "all" | "basic" | "middle" | "high";
export type AdminBadgeTone = "accent" | "neutral" | "danger";

export type AdminVenueInfo = {
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
};

export type AdminVenueRecord = {
  id: string;
  slug: string;
  name: string;
  district: string;
  address: string;
  isActive: boolean;
  matchCount: number;
  venueInfo: AdminVenueInfo;
  defaultImageUrls: string[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
};

export type AdminVenueOption = {
  id: string;
  label: string;
  isActive: boolean;
  name: string;
  district: string;
  address: string;
  venueInfo: AdminVenueInfo;
  defaultImageUrls: string[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
};

export type AdminVenueRow = {
  id: string;
  name: string;
  district: string;
  address: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  matchCountLabel: string;
  editHref: string;
  createMatchHref: string;
};

export type AdminVenueFormValue = {
  name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  defaultImageUrlsText: string;
  defaultRulesText: string;
  defaultSafetyNotesText: string;
  isActive: boolean;
};

export type AdminMatchRecord = {
  id: string;
  slug: string;
  venueId: string;
  title: string;
  venueName: string;
  district: string;
  address: string;
  startAt: string;
  endAt: string;
  status: AdminMatchStatus;
  format: AdminMatchFormat;
  capacity: number;
  currentParticipants: number;
  price: number;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  preparation: string;
  summary: string;
  operatorNote: string;
  publicNotice: string;
  tags: string[];
  imageUrls: string[];
  rules: string[];
  safetyNotes: string[];
  venueInfo: AdminVenueInfo;
};

export type AdminOverviewTone = AdminBadgeTone;

export type AdminOverviewCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: AdminOverviewTone;
};

export type AdminMatchRow = {
  id: string;
  title: string;
  venueLabel: string;
  dateLabel: string;
  timeLabel: string;
  participantLabel: string;
  occupancyLabel: string;
  participantCount: number;
  capacity: number;
  priceLabel: string;
  levelLabel: string;
  description: string;
  status: AdminMatchStatus;
  displayStatusLabel: string;
  displayStatusTone: AdminBadgeTone;
  isNearClosing: boolean;
  tags: string[];
  editHref: string;
};

export type AdminMatchFormValue = {
  venueEntryMode: AdminVenueEntryMode;
  selectedVenueId: string;
  title: string;
  venueName: string;
  district: string;
  address: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  status: AdminMatchStatus | "";
  format: AdminMatchFormat | "";
  capacity: string;
  participantSummary: string;
  price: string;
  genderCondition: string;
  level: AdminMatchLevelPreset | "";
  preparation: string;
  summary: string;
  publicNotice: string;
  operatorNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  imageUrlsText: string;
  tagsText: string;
  rulesText: string;
  safetyNotesText: string;
};
