import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  buildAuthContinueHref,
  normalizePostAuthNextPath,
} from "@/lib/auth/redirect";
import { EmailLoginPage } from "@/components/login/email-login-page";
import { getServerUserState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "이메일 로그인",
  description: "앵클 이메일 로그인 화면",
};

export default async function EmailLoginRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = normalizePostAuthNextPath(toSearchParam(resolvedSearchParams.next));
  const { user } = await getServerUserState();

  if (user) {
    redirect(buildAuthContinueHref(nextPath));
  }

  return <EmailLoginPage nextPath={nextPath} />;
}

function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
