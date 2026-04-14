import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { RouteTransitionProvider } from "@/components/navigation/route-transition-provider";
import { SITE_DESCRIPTION, SITE_NAME, getSiteMetadataBase } from "@/lib/site-metadata";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    apple: "/brand/icon.svg",
    icon: "/brand/icon.svg",
    shortcut: "/brand/icon.svg",
  },
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
