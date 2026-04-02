import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | 앵클",
  description: "앵클 관리자 목업 콘솔",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
