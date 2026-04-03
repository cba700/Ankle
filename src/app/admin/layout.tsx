import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { buildLoginHref } from "@/lib/auth/redirect";
import { getServerAuthState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "Admin | 앵클",
  description: "앵클 관리자 목업 콘솔",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { configured, role, user } = await getServerAuthState();

  if (!configured || !user) {
    redirect(buildLoginHref("/admin", configured ? undefined : "supabase_not_configured"));
  }

  if (role !== "admin") {
    redirect("/");
  }

  return children;
}
