export type RefundPolicyRow = {
  condition: string;
  policy: string;
};

export type RefundPolicyGroup = {
  title: string;
  rows?: RefundPolicyRow[];
  items?: string[];
};

export type RefundPolicySection = {
  description: string;
  groups: RefundPolicyGroup[];
  id: string;
  title: string;
};

export const MATCH_REFUND_SECTION_ID = "match-refund";
export const RAIN_REFUND_SECTION_ID = "rain-refund";

export const MATCH_REFUND_POLICY_HREF = `/refund#${MATCH_REFUND_SECTION_ID}`;
export const RAIN_REFUND_POLICY_HREF = `/refund#${RAIN_REFUND_SECTION_ID}`;

export const MATCH_REFUND_SUMMARY_ROWS: RefundPolicyRow[] = [
  { condition: "매치 2일 전", policy: "무료 취소" },
  { condition: "매치 1일 전", policy: "80% 환불" },
  { condition: "당일 ~ 매치 시작 2시간 전", policy: "20% 환불" },
  { condition: "매치 시작 2시간 이내", policy: "환불 불가" },
];

export const REFUND_POLICY_SECTIONS: RefundPolicySection[] = [
  {
    id: MATCH_REFUND_SECTION_ID,
    title: "매치 환불",
    description: "일반 취소, 참가자 미달, 쿠폰 반환, 자동 전액 환불 기준을 확인할 수 있습니다.",
    groups: [
      {
        title: "소셜 매치 취소 환불 규정",
        rows: MATCH_REFUND_SUMMARY_ROWS,
      },
      {
        title: "참가자 미달 무료 취소",
        rows: [
          { condition: "매치 전날 23:30까지 참가자 미달(1) 매치", policy: "무료 취소" },
          { condition: "매치 시작 4시간 ~ 2시간 전까지 참가자 미달(2) 매치", policy: "무료 취소" },
        ],
      },
      {
        title: "참가자 미달 기준",
        rows: [
          { condition: "참가자 미달(1)", policy: "3vs3: 2명 이하 / 5vs5: 4명 이하" },
          { condition: "참가자 미달(2)", policy: "3vs3: 4명 이하 / 5vs5: 6명 이하" },
        ],
      },
      {
        title: "그 외 취소 기준",
        items: [
          "취소 수수료 발생 시 사용된 포인트를 우선 차감 후 차액을 캐시로 지급합니다.",
          "변경은 상단 취소 환불 규정과 동일하게 적용됩니다.",
          "결제 후 30분 이내에는 하루 1회에 한해 무료 취소가 가능합니다. 단, 매치 시작 2시간 이내일 경우 불가합니다.",
          "쿠폰 신청자는 매치 시작 2시간 전까지 취소 시 쿠폰이 반환됩니다.",
          "실 결제금액(쿠폰 제외)을 기준으로 위 규정에 따라 환불됩니다.",
          "매치 전날까지 최소 인원이 모이지 않을 시 카카오톡 혹은 LMS로 안내되며, 자동 전액 환불됩니다.",
          "매치 시작 2시간 전까지 최소 인원이 모이지 않을 시 카카오톡 혹은 LMS로 안내되며, 자동 전액 환불됩니다. 단, 안내 전 직접 취소하는 경우 상단 일반 환불 규정대로 처리됩니다.",
          "2시간 내 취소자로 최소 인원이 미달되거나, 구장 시설에 긴급한 문제가 생긴 경우 매치 시작 2시간 이내라도 매치를 취소합니다.",
        ],
      },
      {
        title: "다음의 경우는 환불이 불가합니다.",
        items: ["단순 변심으로 취소 혹은 변경을 요청하는 경우"],
      },
      {
        title: "유의사항",
        items: [
          "무단 불참하거나 매치 시작 2시간 이내에 취소하면 페널티를 받습니다.",
          "참여가 어려울 경우, 원활한 매치 진행을 위해 매치를 미리 취소해 주세요.",
        ],
      },
    ],
  },
  {
    id: RAIN_REFUND_SECTION_ID,
    title: "강수 환불",
    description: "우천 취소, 알림톡 발송 기준, 현장 취소 시 환불 방식을 확인할 수 있습니다.",
    groups: [
      {
        title: "강수 환불 규정",
        items: [
          "우천 등 기상 사유로 매치가 취소되는 경우 전액 환불됩니다.",
          "환불은 익일 오전 중으로 환불됩니다.",
          "기상청 날씨누리에서 제공하는 구장 주소별 예보에 따라, 환불이 가능한 경우 '강수 예보 안내' 알림톡이 발송됩니다.",
        ],
      },
      {
        title: "강수 예보 안내 알림톡 발송 기준",
        items: [
          "오전(12시 이전) 매치: 하루 전 22시 기준, 매치 진행 시간의 시간당 강수량 예보 1mm 이상 시",
          "오후(12시 이후) 매치: 매치 시작 4시간 전 기준, 매치 진행 시간의 시간당 강수량 예보 1mm 이상 시",
          "발송 방법: 카카오톡 또는 문자(본인 인증된 연락처)",
          "취소 방법: '강수 예보 안내' 알림톡을 받고, 매치 시작 2시간 전까지 취소하면 전액 환불됩니다.",
        ],
      },
      {
        title: "추가 안내",
        items: [
          "'강수 예보 안내' 알림톡이 발송된 매치는 개별 귀가 시 환불이 불가합니다.",
          "'강수 예보 안내' 알림톡이 발송된 매치에 2시간 이내 신청하는 경우도 위와 동일하게 적용됩니다.",
          "매치 시작 2~3시간 전 시간당 1mm 예보가 있으나 알림톡이 발송되지 않았다면 고객센터로 문의해 주세요.",
          "매치 시작 2시간 내 시간당 1mm 이상 강수 예보가 발생하면 '강수 예보 변동 안내' 알림톡이 발송됩니다. 이 경우, 현장 방문 후 매니저에게 취소 의사를 전달하면 다음 날 오전 전액 포인트 환불됩니다.",
          "알림톡 발송 없이 직접 취소하는 경우 상단 일반 환불 규정대로 처리됩니다.",
          "별도 공지가 없을 시 매치는 정상 진행됩니다.",
          "다수의 인원이 취소하거나 구장 상태가 좋지 않아 진행이 어렵다면 매치 시작 2시간 이내라도 매치를 취소합니다.",
          "현장에서 강수로 인해 매치가 취소되거나 중단되면 진행하지 못한 시간만큼 포인트로 환불됩니다.",
        ],
      },
    ],
  },
];
