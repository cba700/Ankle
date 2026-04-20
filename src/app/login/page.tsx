import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildAuthContinueHref, normalizeNextPath } from "@/lib/auth/redirect";
import { LoginPage } from "@/components/login/login-page";
import { getServerUserState } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "로그인",
  description: "앵클 로그인 화면",
};

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const errorCode = toSearchParam(resolvedSearchParams.error);
  const nextPath = normalizeNextPath(toSearchParam(resolvedSearchParams.next));
  const { user } = await getServerUserState();

  if (user) {
    redirect(buildAuthContinueHref(nextPath));
  }

  return <LoginPage errorCode={errorCode} nextPath={nextPath} />;
}

function toSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
