import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnkleBasket",
  description: "혼자 와도 바로 참여할 수 있는 서울 한강 농구 매칭 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
