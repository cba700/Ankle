export type MatchDetailStatusTone = "neutral" | "accent" | "danger" | "open";

export type MatchDetailInfoKey =
  | "level"
  | "gender"
  | "duration"
  | "format"
  | "shoes"
  | "participants";

export type MatchDetailInfoItem = {
  key: MatchDetailInfoKey;
  value: string;
};

export type MatchDetailDistributionItem = {
  label: string;
  value: number;
  tone: "basic" | "middle" | "high" | "star";
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
  publicId: string;
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
  images: string[];
  infoItems: MatchDetailInfoItem[];
  levelDistribution: MatchDetailDistributionItem[];
  averageLevel: string;
  levelHint: string;
  rules: string[];
  howTo: string[];
  safetyNotes: string[];
  refundRows: MatchDetailRefundRow[];
};
