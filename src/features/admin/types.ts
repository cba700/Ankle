export type AdminMatchStatus = "draft" | "open" | "closed" | "cancelled";
export type AdminMatchFormat = "3vs3" | "5vs5";

export type AdminVenueInfo = {
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
};

export type AdminMatchRecord = {
  id: string;
  slug: string;
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

export type AdminOverviewTone = "accent" | "soft" | "neutral" | "danger";

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
  priceLabel: string;
  levelLabel: string;
  description: string;
  status: AdminMatchStatus;
  tags: string[];
  editHref: string;
};

export type AdminMatchFormValue = {
  title: string;
  venueName: string;
  district: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AdminMatchStatus;
  format: AdminMatchFormat;
  capacity: string;
  currentParticipants: string;
  price: string;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  preparation: string;
  summary: string;
  publicNotice: string;
  operatorNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  tagsText: string;
  rulesText: string;
  safetyNotesText: string;
};
