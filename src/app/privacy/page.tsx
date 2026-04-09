import type { Metadata } from "next";
import { LegalDocument, type LegalDocumentSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "앵클 개인정보처리방침 안내 페이지",
  robots: {
    follow: false,
    index: false,
  },
};

const sections: LegalDocumentSection[] = [
  {
    title: "1. 수집 대상 정보",
    body: [
      "현재 서비스 구조상 로그인 계정 정보, 프로필 정보, 매치 신청 이력, 캐시 거래 내역, 결제 주문 정보가 처리 대상에 포함될 수 있습니다.",
      "정확한 수집 항목과 필수·선택 구분은 실제 운영 정책과 외부 연동 범위를 확인한 뒤 확정해야 합니다.",
    ],
  },
  {
    title: "2. 처리 목적",
    body: [
      "수집된 정보는 로그인 유지, 신청 처리, 결제 확인, 캐시 적립 및 환급, 고객 문의 대응을 위해 사용될 예정입니다.",
      "서비스 화면에 이미 존재하는 마이페이지, 관리자 캐시 운영, 결제 확인 흐름을 기준으로 정식 목적 조항을 작성해야 합니다.",
    ],
  },
  {
    title: "3. 보관 및 제공",
    body: [
      "보관 기간, 파기 절차, 제3자 제공, 처리 위탁 항목은 실제 인프라와 운영 계약 기준으로 명시되어야 합니다.",
      "특히 Supabase, TossPayments, Kakao 로그인 연동에 대한 고지는 정식 문안에서 빠지면 안 됩니다.",
    ],
  },
  {
    title: "4. 정보주체 권리 안내",
    body: [
      "열람, 정정, 삭제, 처리정지 요청 방법과 문의 채널은 운영 연락처가 확정되면 이 페이지에 반영합니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      lead="로그인, 신청, 결제 흐름에서 처리될 수 있는 개인정보 항목과 목적을 정리하기 위한 페이지입니다."
      notice="현재는 실제 기능 범위를 기준으로 한 placeholder 문서입니다. 연락처, 보관 기간, 위탁/제공 관계, 시행일은 운영 기준이 확정되면 정식 개인정보처리방침으로 교체해야 합니다."
      sections={sections}
      title="개인정보처리방침"
      updatedAtLabel="정식 문안 확정 전"
    />
  );
}
