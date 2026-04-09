import type { Metadata } from "next";
import { LegalDocument, type LegalDocumentSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "이용약관",
  description: "앵클 이용약관 안내 페이지",
  robots: {
    follow: false,
    index: false,
  },
};

const sections: LegalDocumentSection[] = [
  {
    title: "1. 서비스 개요",
    body: [
      "앵클은 한강 농구 매치 탐색, 참가 신청, 캐시 충전과 같은 기능을 제공하는 서비스입니다.",
      "정식 운영 전까지 본 문서는 실제 제공 기능과 운영 정책을 기준으로 구조만 먼저 공개합니다.",
    ],
  },
  {
    title: "2. 계정과 신청",
    body: [
      "사용자는 카카오 로그인 후 매치 신청, 캐시 충전, 마이페이지 이용이 가능합니다.",
      "매치 신청은 단순 예약이 아니라 캐시 차감과 함께 확정되는 흐름을 전제로 정식 약관이 확정될 예정입니다.",
    ],
  },
  {
    title: "3. 결제와 환불",
    body: [
      "캐시 충전과 환불, 매치 취소 규정은 서비스 운영 정책과 결제대행 계약 내용에 맞춰 최종 문안으로 교체될 예정입니다.",
      "현재 화면에 노출되는 충전 및 취소 안내는 운영 흐름을 설명하기 위한 정보이며, 최종 약관 고시 전까지 placeholder 상태입니다.",
    ],
  },
  {
    title: "4. 공지 예정 항목",
    body: [
      "사업자 정보, 시행일, 분쟁 처리 절차, 금지 행위, 책임 제한 조항은 운영 주체 정보가 확정되면 본 페이지에 반영합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      lead="서비스 이용 조건, 계정 사용 기준, 캐시 및 매치 신청 관련 기본 구조를 안내하는 페이지입니다."
      notice="현재는 실제 서비스 구조에 맞춘 자리표시자 문서입니다. 운영 주체 정보, 시행일, 정식 조항은 추후 확정 문안으로 교체해야 합니다."
      sections={sections}
      title="이용약관"
      updatedAtLabel="정식 문안 확정 전"
    />
  );
}
