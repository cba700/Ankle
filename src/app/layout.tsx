import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { RouteTransitionProvider } from "@/components/navigation/route-transition-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "앵클",
    template: "%s | 앵클",
  },
  description: "혼자 와도 바로 참여할 수 있는 서울 한강 농구 매칭 플랫폼",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Suspense fallback={children}>
          <RouteTransitionProvider>{children}</RouteTransitionProvider>
        </Suspense>
      </body>
    </html>
  );
}
