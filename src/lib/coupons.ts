import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CouponTemplateType = "signup_welcome";
export type UserCouponStatus = "available" | "used" | "expired";

export type CouponTemplateEntity = {
  autoIssueOnSignup: boolean;
  createdAt: string;
  discountAmount: number;
  id: string;
  isActive: boolean;
  name: string;
  templateType: CouponTemplateType;
  updatedAt: string;
};

export type UserCouponEntity = {
  createdAt: string;
  discountAmountSnapshot: number;
  id: string;
  issuedAt: string;
  issuedReason: string;
  nameSnapshot: string;
  restoreCount: number;
  restoredAt: string | null;
  status: UserCouponStatus;
  templateId: string | null;
  updatedAt: string;
  usedAt: string | null;
  usedMatchApplicationId: string | null;
  userId: string;
};

export type CouponUsageSummary = {
  status: UserCouponStatus;
  templateId: string | null;
};

type CouponTemplateRow = {
  auto_issue_on_signup: boolean;
  created_at: string;
  discount_amount: number;
  id: string;
  is_active: boolean;
  name: string;
  template_type: CouponTemplateType;
  updated_at: string;
};

type UserCouponRow = {
  created_at: string;
  discount_amount_snapshot: number;
  id: string;
  issued_at: string;
  issued_reason: string;
  name_snapshot: string;
  restore_count: number;
  restored_at: string | null;
  status: UserCouponStatus;
  template_id: string | null;
  updated_at: string;
  used_at: string | null;
  used_match_application_id: string | null;
  user_id: string;
};

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

export async function getAvailableSignupCouponByUserId(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const coupons = await listAvailableUserCouponsByUserId(supabase, userId, 20);

  return coupons.find((coupon) => coupon.issuedReason === "signup_welcome") ?? null;
}

export async function listUserCouponsByUserId(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("user_coupons")
    .select(
      "id, template_id, user_id, name_snapshot, discount_amount_snapshot, status, issued_reason, used_match_application_id, issued_at, used_at, restored_at, restore_count, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("issued_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load user coupons: ${error.message}`);
  }

  return ((data ?? []) as UserCouponRow[]).map(mapUserCoupon);
}

export async function listAvailableUserCouponsByUserId(
  supabase: SupabaseServerClient,
  userId: string,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("user_coupons")
    .select(
      "id, template_id, user_id, name_snapshot, discount_amount_snapshot, status, issued_reason, used_match_application_id, issued_at, used_at, restored_at, restore_count, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("status", "available")
    .order("discount_amount_snapshot", { ascending: false })
    .order("issued_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load available user coupons: ${error.message}`);
  }

  return ((data ?? []) as UserCouponRow[]).map(mapUserCoupon);
}

export async function listCouponTemplates(
  supabase: SupabaseServerClient,
  limit = 20,
) {
  const { data, error } = await supabase
    .from("coupon_templates")
    .select(
      "id, name, discount_amount, template_type, auto_issue_on_signup, is_active, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load coupon templates: ${error.message}`);
  }

  return ((data ?? []) as CouponTemplateRow[]).map(mapCouponTemplate);
}

export async function listCouponUsageSummaries(
  supabase: SupabaseServerClient,
) {
  const { data, error } = await supabase
    .from("user_coupons")
    .select("template_id, status");

  if (error) {
    throw new Error(`Failed to load coupon usage summaries: ${error.message}`);
  }

  return ((data ?? []) as Array<Pick<UserCouponRow, "status" | "template_id">>).map((row) => ({
    status: row.status,
    templateId: row.template_id,
  }));
}

function mapCouponTemplate(row: CouponTemplateRow): CouponTemplateEntity {
  return {
    autoIssueOnSignup: row.auto_issue_on_signup,
    createdAt: row.created_at,
    discountAmount: row.discount_amount,
    id: row.id,
    isActive: row.is_active,
    name: row.name,
    templateType: row.template_type,
    updatedAt: row.updated_at,
  };
}

function mapUserCoupon(row: UserCouponRow): UserCouponEntity {
  return {
    createdAt: row.created_at,
    discountAmountSnapshot: row.discount_amount_snapshot,
    id: row.id,
    issuedAt: row.issued_at,
    issuedReason: row.issued_reason,
    nameSnapshot: row.name_snapshot,
    restoreCount: row.restore_count,
    restoredAt: row.restored_at,
    status: row.status,
    templateId: row.template_id,
    updatedAt: row.updated_at,
    usedAt: row.used_at,
    usedMatchApplicationId: row.used_match_application_id,
    userId: row.user_id,
  };
}
