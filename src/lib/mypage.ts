import "server-only";

import type { User } from "@supabase/supabase-js";
import {
  formatCompactDateLabel,
  formatDateLabel,
  formatSeoulTime,
} from "@/lib/date";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/auth";

type ProfileRow = {
  avatar_url: string | null;
  display_name: string | null;
  role: UserRole | null;
};

type MatchRow = {
  slug: string | null;
  start_at: string | null;
  title: string | null;
  venue_name: string | null;
};

type ApplicationRow = {
  applied_at: string;
  id: string;
  match: MatchRow | MatchRow[] | null;
  status: MyPageApplicationStatus;
};

export type MyPageApplicationStatus =
  | "confirmed"
  | "cancelled_by_user"
  | "cancelled_by_admin";

export type MyPageProfile = {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  providerLabel: string;
  role: UserRole;
};

export type MyPageApplication = {
  href: string | null;
  id: string;
  metaLabel: string;
  statusLabel: string;
  statusTone: "accent" | "danger" | "muted";
  title: string;
  venueName: string;
};

export type MyPageData = {
  applications: MyPageApplication[];
  profile: MyPageProfile;
};

const APPLICATION_SELECT = `
  id,
  status,
  applied_at,
  match:matches!match_applications_match_id_fkey (
    slug,
    start_at,
    title,
    venue_name
  )
`;

export async function getMyPageData({
  role,
  user,
}: {
  role: UserRole;
  user: User;
}): Promise<MyPageData> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const [{ data: profile }, { data: applications, error: applicationError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("match_applications")
        .select(APPLICATION_SELECT)
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false }),
    ]);

  const typedProfile = profile as ProfileRow | null;

  if (applicationError) {
    throw new Error(`Failed to load mypage applications: ${applicationError.message}`);
  }

  return {
    applications: ((applications ?? []) as ApplicationRow[]).map(mapApplication),
    profile: {
      avatarUrl: typedProfile?.avatar_url ?? null,
      displayName: getDisplayName(user, typedProfile),
      email: user.email ?? "이메일 정보 없음",
      providerLabel: getProviderLabel(user),
      role: typedProfile?.role ?? role,
    },
  };
}

function mapApplication(application: ApplicationRow): MyPageApplication {
  const match = normalizeMatch(application.match);

  return {
    href: match?.slug ? `/match/${match.slug}` : null,
    id: application.id,
    metaLabel: getMetaLabel(match, application.applied_at),
    statusLabel: getStatusLabel(application.status),
    statusTone: getStatusTone(application.status),
    title: match?.title?.trim() || "매치 정보 확인 불가",
    venueName: match?.venue_name?.trim() || "장소 정보 확인 불가",
  };
}

function normalizeMatch(match: ApplicationRow["match"]) {
  if (!match) {
    return null;
  }

  return Array.isArray(match) ? match[0] ?? null : match;
}

function getDisplayName(user: User, profile: ProfileRow | null) {
  const userMetadata = user.user_metadata;

  return (
    profile?.display_name?.trim() ||
    (typeof userMetadata?.name === "string" ? userMetadata.name.trim() : "") ||
    (typeof userMetadata?.full_name === "string"
      ? userMetadata.full_name.trim()
      : "") ||
    user.email ||
    "앵클 사용자"
  );
}

function getProviderLabel(user: User) {
  const provider =
    user.app_metadata?.provider ??
    (Array.isArray(user.app_metadata?.providers)
      ? user.app_metadata.providers[0]
      : null);

  if (typeof provider === "string" && provider.trim()) {
    return provider.toUpperCase();
  }

  return "ACCOUNT";
}

function getMetaLabel(match: MatchRow | null, appliedAt: string) {
  const appliedDateLabel = formatAppliedDate(appliedAt);

  if (!match?.start_at) {
    return `${appliedDateLabel} 신청`;
  }

  return `${formatSchedule(match.start_at)} · ${appliedDateLabel} 신청`;
}

function formatSchedule(startAt: string) {
  const date = new Date(startAt);

  return `${formatDateLabel(date)} ${formatSeoulTime(date)}`;
}

function formatAppliedDate(appliedAt: string) {
  return formatCompactDateLabel(new Date(appliedAt));
}

function getStatusLabel(status: MyPageApplicationStatus) {
  switch (status) {
    case "cancelled_by_admin":
      return "운영 취소";
    case "cancelled_by_user":
      return "신청 취소";
    case "confirmed":
    default:
      return "신청 완료";
  }
}

function getStatusTone(status: MyPageApplicationStatus) {
  switch (status) {
    case "cancelled_by_admin":
      return "danger";
    case "cancelled_by_user":
      return "muted";
    case "confirmed":
    default:
      return "accent";
  }
}
