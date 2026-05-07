export type AdminMatchStatus = "draft" | "open" | "closed" | "cancelled";
export type AdminMatchFormat = "3vs3" | "4vs4" | "5vs5";
export type AdminVenueEntryMode = "managed" | "manual";
export type AdminMatchLevelPreset = "all" | "basic" | "middle" | "high";
export type AdminMatchRefundExceptionMode =
  | "none"
  | "participant_shortage_day_before"
  | "participant_shortage_same_day"
  | "rain_notice"
  | "rain_change_notice";
export type AdminBadgeTone = "accent" | "neutral" | "danger";
export type AdminShellNav =
  | "dashboard"
  | "matches"
  | "venues"
  | "banners"
  | "cash"
  | "coupons"
  | "create";

export type AdminHomeBannerRecord = {
  id: string;
  title: string;
  imageUrl: string;
  href: string | null;
  displayOrder: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminVenueInfo = {
  courtNote?: string;
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
  courtNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  defaultImageUrls: string[];
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
  refundExceptionMode: AdminMatchRefundExceptionMode;
  participants: AdminMatchParticipantRecord[];
  venueInfo: AdminVenueInfo;
};

export type AdminMatchParticipantRecord = {
  applicationId: string;
  displayName: string;
  gender: "female" | "male" | null;
  noShowNoticeSent: boolean;
  playerLevel: string | null;
  playerLevelSource: "player_level" | "temporary_level" | "unset";
  userId: string;
};

export type AdminOverviewTone = AdminBadgeTone;

export type AdminOverviewCard = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: AdminOverviewTone;
};

export type AdminCashAccountRow = {
  balanceLabel: string;
  userId: string;
};

export type AdminCashTransactionRow = {
  amountLabel: string;
  balanceLabel: string;
  id: string;
  metaLabel: string;
  title: string;
  tone: AdminBadgeTone;
  userId: string;
};

export type AdminCashChargeOrderRow = {
  amountLabel: string;
  detailLabel: string;
  id: string;
  metaLabel: string;
  orderId: string;
  paymentKeyLabel: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  userId: string;
};

export type AdminCashChargeOrderEventRow = {
  eventType: string;
  id: string;
  metaLabel: string;
  orderId: string;
  processedResultLabel: string;
};

export type AdminCashRefundRequestRow = {
  id: string;
  metaLabel: string;
  refundMethodLabel: string;
  requestedAmountLabel: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  userId: string;
};

export type AdminCouponTemplateRecord = {
  availableCount: number;
  createdAt: string;
  discountAmount: number;
  id: string;
  isActive: boolean;
  issuedCount: number;
  name: string;
  templateType: "referral_invitee" | "referral_inviter" | "signup_welcome";
  updatedAt: string;
  usedCount: number;
};

export type AdminCouponTemplateRow = {
  availableCountLabel: string;
  discountAmount: number;
  discountAmountLabel: string;
  id: string;
  isActive: boolean;
  issuedCountLabel: string;
  metaLabel: string;
  name: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  usedCountLabel: string;
};

export type AdminMatchRow = {
  id: string;
  startAt: string;
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
  refundExceptionLabel: string | null;
  refundExceptionMode: AdminMatchRefundExceptionMode;
  refundExceptionTone: AdminBadgeTone | null;
  isNearClosing: boolean;
  isSoldOut: boolean;
  tags: string[];
  editHref: string;
  participantPreviewLabel: string;
  participants: AdminMatchParticipantRow[];
  quickSummary: string;
};

export type AdminMatchParticipantRow = {
  applicationId: string;
  displayName: string;
  genderLabel: string;
  noShowNoticeSent: boolean;
  playerLevelLabel: string;
  resolvedPlayerLevel: string | null;
  userId: string;
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
  refundExceptionMode: AdminMatchRefundExceptionMode;
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
  courtNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  imageUrlsText: string;
  tagsText: string;
  rulesText: string;
  safetyNotesText: string;
};
