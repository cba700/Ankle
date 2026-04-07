import { formatMoney } from "@/lib/date";
import { REFUND_POLICY, type MatchRecord } from "@/lib/matches";
import type {
  MatchDetailFacility,
  MatchDetailInfoItem,
  MatchDetailRefundRow,
  MatchDetailStatusTone,
  MatchDetailViewModel,
} from "./match-detail-types";

type MatchDetailOverride = {
  likes?: number;
  views?: number;
  notice?: string;
  courtSize?: string;
  snackAvailable?: boolean;
  courtNotes?: string[];
  howTo?: string[];
  refundRows?: MatchDetailRefundRow[];
};

const DETAIL_OVERRIDES: Record<string, MatchDetailOverride> = {
  "match-01": {
    likes: 3,
    views: 97,
    notice: "황사나 미세먼지가 심한 날에는 운영 공지가 먼저 전달됩니다.",
  },
  "match-02": {
    likes: 7,
    views: 118,
    notice: "뚝섬 코트는 야간 조명 환경이 좋아 늦은 시간에도 진행 안정성이 높습니다.",
  },
  "match-03": {
    likes: 5,
    views: 82,
    notice: "주말 낮 매치는 입문 참가자가 많아 기본 브리핑 이후 천천히 시작합니다.",
  },
  "match-04": {
    likes: 4,
    views: 64,
    notice: "야외 코트 노면 상태에 따라 경기 강도가 바로 조정될 수 있습니다.",
  },
  "match-05": {
    likes: 8,
    views: 129,
    courtSize: "28×15m",
  },
  "match-07": {
    likes: 6,
    views: 104,
    notice: "광나루 매치는 전개 속도가 빨라 기본 체력과 발목 보호를 권장합니다.",
  },
};

export function buildMatchDetailViewModel(match: MatchRecord): MatchDetailViewModel {
  const override = DETAIL_OVERRIDES[match.id] ?? {};
  const numericId = Number.parseInt(match.id.split("-")[1] ?? "1", 10) || 1;

  return {
    id: match.id,
    slug: match.slug,
    title: match.title,
    statusLabel: match.status.label,
    statusTone: getStatusTone(match.status.kind),
    dateText: match.dateLabel,
    time: match.time,
    courtName: match.venueName,
    address: match.address,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.address)}`,
    likes: override.likes ?? 2 + numericId * 2,
    views: override.views ?? 72 + numericId * 17 + match.currentParticipants * 3,
    notice: override.notice ?? getDefaultNotice(match),
    priceLabel: `${formatMoney(match.price)}원`,
    images: match.imageUrls,
    infoItems: buildInfoItems(match),
    levelDistribution: match.levelDistribution,
    averageLevel: match.averageLevel,
    levelHint: match.averageLevel,
    facilities: buildFacilities(match, override),
    courtNotes: override.courtNotes ?? buildCourtNotes(match),
    rules: match.rules,
    howTo: override.howTo ?? buildHowTo(match),
    safetyNotes: match.safetyNotes,
    refundRows: override.refundRows ?? REFUND_POLICY.map((row) => ({
      condition: row.point,
      policy: row.detail,
    })),
  };
}

function buildInfoItems(match: MatchRecord): MatchDetailInfoItem[] {
  return [
    { key: "level", label: "레벨", value: match.levelCondition },
    { key: "gender", label: "성별", value: match.genderCondition },
    { key: "duration", label: "진행 시간", value: match.durationText },
    { key: "format", label: "경기 방식", value: formatMatchFormat(match.format) },
    { key: "shoes", label: "준비물", value: match.preparation },
  ];
}

function buildFacilities(
  match: MatchRecord,
  override: MatchDetailOverride,
): MatchDetailFacility[] {
  return [
    {
      key: "size",
      label: override.courtSize ?? (match.format === "5vs5" ? "28×15m" : "Half Court"),
    },
    {
      key: "parking",
      label: summarizeParking(match.venueInfo.parking),
    },
    {
      key: "shower",
      label: "샤워실",
      available: hasFacility(match.venueInfo.showerLocker, ["샤워"], ["없"]),
    },
    {
      key: "locker",
      label: "락커/보관",
      available: hasFacility(match.venueInfo.showerLocker, ["락커", "보관"], ["없"]),
    },
    {
      key: "snack",
      label: "간식/음료",
      available: override.snackAvailable ?? false,
    },
    {
      key: "toilet",
      label: "화장실",
      available: true,
    },
  ];
}

function buildCourtNotes(match: MatchRecord) {
  return [
    `찾아오는 길: ${match.venueInfo.directions}`,
    `주차: ${match.venueInfo.parking}`,
    `흡연: ${match.venueInfo.smoking}`,
    `보관/샤워: ${match.venueInfo.showerLocker}`,
  ];
}

function buildHowTo(match: MatchRecord) {
  return [
    `${match.preparation}만 준비해 오면 됩니다.`,
    "매니저가 출석 확인과 팀 밸런스 조정을 도와드립니다.",
    `${match.levelCondition} 기준으로 코트 템포와 매치 경험을 맞춰 팀을 나눕니다.`,
    "친구와 함께 와도 현장 상황에 맞춰 팀을 다시 조정할 수 있습니다.",
  ];
}

function getDefaultNotice(match: MatchRecord) {
  if (match.format === "5vs5") {
    return "진행 인원에 따라 2개 팀 또는 3개 팀 로테이션으로 운영될 수 있습니다.";
  }

  return "입문자도 쉽게 적응할 수 있도록 첫 두 경기는 밸런스 중심으로 진행합니다.";
}

function summarizeParking(parking: string) {
  if (parking.includes("혼잡") || parking.includes("정체") || parking.includes("만차")) {
    return "주차 가능 / 혼잡 가능";
  }

  if (parking.includes("가능")) {
    return "주차 가능";
  }

  return "주차 확인";
}

function hasFacility(source: string, includes: string[], excludes: string[]) {
  if (excludes.some((keyword) => source.includes(keyword))) {
    return false;
  }

  return includes.some((keyword) => source.includes(keyword));
}

function getStatusTone(kind: MatchRecord["status"]["kind"]): MatchDetailStatusTone {
  if (kind === "closingSoon") {
    return "danger";
  }

  if (kind === "confirmedSoon") {
    return "accent";
  }

  if (kind === "open") {
    return "open";
  }

  return "neutral";
}

function formatMatchFormat(format: MatchRecord["format"]) {
  return format === "5vs5" ? "5vs5" : "3vs3";
}
