export type MatchDetailStatusTone = "neutral" | "accent" | "danger" | "open";

export type MatchDetailInfoKey =
  | "level"
  | "gender"
  | "duration"
  | "format"
  | "headcount"
  | "shoes";

export type MatchDetailInfoItem = {
  key: MatchDetailInfoKey;
  label: string;
  value: string;
};

export type MatchDetailDistributionItem = {
  label: string;
  value: number;
  tone: "basic" | "middle" | "high";
};

export type MatchDetailFacilityKey =
  | "size"
  | "parking"
  | "shower"
  | "locker"
  | "snack"
  | "toilet";

export type MatchDetailFacility = {
  key: MatchDetailFacilityKey;
  label: string;
  available?: boolean;
};

export type MatchDetailRefundRow = {
  condition: string;
  policy: string;
};

export type MatchToastTone = "default" | "success" | "accent";

export type MatchToastState = {
  message: string;
  tone: MatchToastTone;
};

export type MatchDetailViewModel = {
  id: string;
  slug: string;
  title: string;
  statusLabel: string;
  statusTone: MatchDetailStatusTone;
  dateText: string;
  time: string;
  courtName: string;
  address: string;
  mapUrl: string;
  likes: number;
  views: number;
  notice: string;
  priceLabel: string;
  participantSummary: string;
  images: string[];
  infoItems: MatchDetailInfoItem[];
  levelDistribution: MatchDetailDistributionItem[];
  averageLevel: string;
  levelHint: string;
  facilities: MatchDetailFacility[];
  courtNotes: string[];
  rules: string[];
  howTo: string[];
  refundRows: MatchDetailRefundRow[];
};

