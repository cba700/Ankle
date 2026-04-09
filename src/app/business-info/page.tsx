import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "사업자정보확인",
  description: "앵클베스킷 사업자정보확인 페이지",
  robots: {
    follow: false,
    index: false,
  },
};

export default function BusinessInfoPage() {
  return <LegalDocument title="사업자정보확인" />;
}
