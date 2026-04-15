"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatSeoulDateInput, formatSeoulTime } from "@/lib/date";
import { retryPendingTossChargeOrder } from "@/lib/payments/toss-charge";
import { buildPlayerLevelValue } from "@/lib/player-levels";
import { getServerAuthState } from "@/lib/supabase/auth";
import {
  assertAdminPlayerLevelSchemaReady,
  assertCashChargeOperationsSchemaReady,
  assertCouponSchemaReady,
  assertCashRefundRequestSchemaReady,
  assertVenueManagementSchemaReady,
} from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import {
  deleteVenueImageUrls,
  isManagedVenueImageUrl,
  uploadVenueImageFiles,
} from "@/lib/venue-images";
import {
  buildGeneratedMatchTitle,
  getMatchLevelValues,
  inferDistrictFromAddress,
} from "./match-form";
import type {
  AdminMatchFormat,
  AdminMatchLevelPreset,
  AdminMatchStatus,
  AdminVenueEntryMode,
} from "./types";

type VenueWriteResult = {
  id: string;
  slug: string;
};

type VenueFormValues = {
  name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  imageFiles: File[];
  imageOrder: VenueImageOrderEntry[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
  isActive: boolean;
};

type VenueWriteValues = {
  name: string;
  district: string;
  address: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  defaultImageUrls: string[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
  isActive: boolean;
};

type VenueImageOrderEntry =
  | {
      kind: "existing";
      url: string;
    }
  | {
      kind: "new";
      fileName: string;
    };

type MatchCountResult = {
  confirmed_count: number;
};

type CouponTemplateFormValues = {
  discountAmount: number;
  isActive: boolean;
  name: string;
};

const MATCH_STATUSES: AdminMatchStatus[] = ["draft", "open", "closed", "cancelled"];
const MATCH_FORMATS: AdminMatchFormat[] = ["3vs3", "5vs5"];
const MATCH_LEVELS: AdminMatchLevelPreset[] = ["all", "basic", "middle", "high"];
const VENUE_ENTRY_MODES: AdminVenueEntryMode[] = ["managed", "manual"];
const CREATE_MATCH_INTENTS = ["save_draft", "publish_now"] as const;
const UPDATE_MATCH_INTENTS = ["save_changes"] as const;

type AdminSupabaseClient = NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>;

export async function createAdminMatchAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const values = readCreateMatchFormValues(formData);
  const venue = await resolveVenueForMatch(supabase, values);
  const slug = buildMatchSlug(venue.slug, values.startAt);

  const { data, error } = await supabase
    .from("matches")
    .insert({
      venue_id: venue.id,
      slug,
      venue_name: values.venueName,
      district: values.district,
      address: values.address,
      directions: values.directions,
      parking: values.parking,
      smoking: values.smoking,
      shower_locker: values.showerLocker,
      title: values.title,
      summary: values.summary,
      public_notice: values.publicNotice,
      operator_note: values.operatorNote,
      status: values.status,
      format: values.format,
      start_at: values.startAt,
      end_at: values.endAt,
      capacity: values.capacity,
      price: values.price,
      gender_condition: values.genderCondition,
      level_condition: values.levelCondition,
      level_range: values.levelRange,
      preparation: values.preparation,
      tags: values.tags,
      rules: values.rules,
      safety_notes: values.safetyNotes,
      image_urls: values.imageUrls,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create match");
  }

  redirect(`/admin/matches/${data.id}/edit`);
}

export async function updateAdminMatchAction(matchId: string, formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  await assertCouponSchemaReady(supabase);
  const values = readUpdateMatchFormValues(formData);
  const venue = await resolveVenueForMatch(supabase, values);
  const confirmedCount = await getConfirmedCount(supabase, matchId);

  if (values.capacity < confirmedCount) {
    throw new Error("Capacity cannot be lower than the current confirmed participants");
  }

  const slug = buildMatchSlug(venue.slug, values.startAt);

  const { error } = await supabase
    .from("matches")
    .update({
      venue_id: venue.id,
      slug,
      venue_name: values.venueName,
      district: values.district,
      address: values.address,
      directions: values.directions,
      parking: values.parking,
      smoking: values.smoking,
      shower_locker: values.showerLocker,
      title: values.title,
      summary: values.summary,
      public_notice: values.publicNotice,
      operator_note: values.operatorNote,
      status: values.status,
      format: values.format,
      start_at: values.startAt,
      end_at: values.endAt,
      capacity: values.capacity,
      price: values.price,
      gender_condition: values.genderCondition,
      level_condition: values.levelCondition,
      level_range: values.levelRange,
      preparation: values.preparation,
      tags: values.tags,
      rules: values.rules,
      safety_notes: values.safetyNotes,
      image_urls: values.imageUrls,
    })
    .eq("id", matchId);

  if (error) {
    throw new Error(error.message);
  }

  if (values.status === "cancelled") {
    const { error: cancelError } = await supabase.rpc(
      "cancel_match_applications_by_admin",
      {
        p_match_id: matchId,
      },
    );

    if (cancelError) {
      throw new Error(cancelError.message);
    }
  }

  redirect(`/admin/matches/${matchId}/edit`);
}

export async function createAdminVenueAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const values = readVenueFormValues(formData);
  const venue = await createVenue(supabase, {
    name: values.name,
    district: values.district,
    address: values.address,
    directions: values.directions,
    parking: values.parking,
    smoking: values.smoking,
    showerLocker: values.showerLocker,
    defaultImageUrls: [],
    defaultRules: values.defaultRules,
    defaultSafetyNotes: values.defaultSafetyNotes,
    isActive: values.isActive,
  });
  let uploadedUrls: string[] = [];

  try {
    const uploadedUrlMap = await uploadVenueImageFiles(admin, {
      files: values.imageFiles,
      venueId: venue.id,
    });
    uploadedUrls = Array.from(uploadedUrlMap.values());
    const defaultImageUrls = buildVenueImageUrls({
      imageOrder: values.imageOrder,
      previousUrls: [],
      uploadedUrls: uploadedUrlMap,
    });

    await updateVenueImages(supabase, venue.id, defaultImageUrls);
  } catch (error) {
    await safeDeleteVenueImageUrls(admin, uploadedUrls);
    await cleanupFailedVenueCreation(admin, venue.id);
    throw error;
  }

  redirect(`/admin/venues/${venue.id}/edit`);
}

export async function updateAdminVenueAction(venueId: string, formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const values = readVenueFormValues(formData);
  const previousImageUrls = await getVenueImageUrls(supabase, venueId);
  const slug = toSlug(`${values.district} ${values.name}`);
  let uploadedUrls: string[] = [];
  let defaultImageUrls: string[] = [];

  try {
    const uploadedUrlMap = await uploadVenueImageFiles(admin, {
      files: values.imageFiles,
      venueId,
    });
    uploadedUrls = Array.from(uploadedUrlMap.values());
    defaultImageUrls = buildVenueImageUrls({
      imageOrder: values.imageOrder,
      previousUrls: previousImageUrls,
      uploadedUrls: uploadedUrlMap,
    });

    const { error } = await supabase
      .from("venues")
      .update({
        slug,
        name: values.name,
        district: values.district,
        address: values.address,
        directions: values.directions,
        parking: values.parking,
        smoking: values.smoking,
        shower_locker: values.showerLocker,
        default_image_urls: defaultImageUrls,
        default_rules: values.defaultRules,
        default_safety_notes: values.defaultSafetyNotes,
        is_active: values.isActive,
      })
      .eq("id", venueId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    await safeDeleteVenueImageUrls(admin, uploadedUrls);
    throw error;
  }

  await safeDeleteVenueImageUrls(
    admin,
    previousImageUrls.filter(
      (url) => isManagedVenueImageUrl(url) && !defaultImageUrls.includes(url),
    ),
  );

  redirect(`/admin/venues/${venueId}/edit`);
}

export async function adjustAdminCashBalanceAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const amount = Number.parseInt(String(formData.get("amount") ?? "").trim(), 10);
  const memo = String(formData.get("memo") ?? "").trim();

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!Number.isInteger(amount) || amount === 0) {
    throw new Error("Amount must be a non-zero integer");
  }

  if (!memo) {
    throw new Error("Memo is required");
  }

  const { error } = await admin.rpc("adjust_cash_balance_by_admin", {
    p_amount: amount,
    p_memo: memo,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/cash");
}

export async function retryPendingCashChargeOrderAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCashChargeOperationsSchemaReady(supabase);

  const admin = getSupabaseServiceRoleClient() as any;

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!orderId) {
    throw new Error("Order ID is required");
  }

  const result = await retryPendingTossChargeOrder(admin, orderId);

  if (!result.ok) {
    throw new Error(result.message);
  }

  redirect("/admin/cash");
}

export async function approveCashRefundRequestAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCashRefundRequestSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    throw new Error("Refund request ID is required");
  }

  const { error } = await admin.rpc("approve_cash_refund_request", {
    p_note: null,
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/cash");
}

export async function rejectCashRefundRequestAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCashRefundRequestSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    throw new Error("Refund request ID is required");
  }

  const { error } = await admin.rpc("reject_cash_refund_request", {
    p_note: null,
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/cash");
}

export async function updateAdminPlayerLevelAction(formData: FormData) {
  await requireAdminSupabase();
  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  await assertAdminPlayerLevelSchemaReady(admin);
  const userId = String(formData.get("userId") ?? "").trim();
  const levelCategory = String(formData.get("levelCategory") ?? "").trim();
  const levelNumber = String(formData.get("levelNumber") ?? "").trim();
  const playerLevel = buildPlayerLevelValue(levelCategory, levelNumber);

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!playerLevel) {
    throw new Error("Player level is required");
  }

  const { error } = await ((admin.from("profiles" as any) as any)
    .update({
      player_level: playerLevel,
    })
    .eq("id", userId));

  if (error) {
    throw new Error(`Failed to update player level: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/matches");
}

export async function createAdminCouponTemplateAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCouponSchemaReady(supabase);
  const values = readCouponTemplateFormValues(formData);

  const { error } = await ((supabase.from("coupon_templates" as any) as any).insert({
    auto_issue_on_signup: true,
    discount_amount: values.discountAmount,
    is_active: values.isActive,
    name: values.name,
    template_type: "signup_welcome",
  }));

  if (error) {
    throw new Error(`Failed to create coupon template: ${error.message}`);
  }

  redirect("/admin/coupons");
}

export async function updateAdminCouponTemplateAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCouponSchemaReady(supabase);
  const templateId = String(formData.get("templateId") ?? "").trim();
  const values = readCouponTemplateFormValues(formData);

  if (!templateId) {
    throw new Error("Coupon template ID is required");
  }

  const { error } = await ((supabase.from("coupon_templates" as any) as any)
    .update({
      discount_amount: values.discountAmount,
      is_active: values.isActive,
      name: values.name,
    })
    .eq("id", templateId));

  if (error) {
    throw new Error(`Failed to update coupon template: ${error.message}`);
  }

  redirect("/admin/coupons");
}

async function requireAdminSupabase() {
  const { configured, role, user } = await getServerAuthState();

  if (!configured) {
    throw new Error("Supabase is not configured");
  }

  if (!user || role !== "admin") {
    throw new Error("Admin access required");
  }

  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  return supabase;
}

async function resolveVenueForMatch(
  supabase: AdminSupabaseClient,
  values: MatchFormValues,
) {
  if (values.venueEntryMode === "managed" && values.selectedVenueId) {
    return getManagedVenue(supabase, values.selectedVenueId);
  }

  return resolveManualVenue(supabase, values);
}

async function getManagedVenue(
  supabase: AdminSupabaseClient,
  venueId: string,
) {
  const { data, error } = await supabase
    .from("venues")
    .select("id, slug")
    .eq("id", venueId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load venue");
  }

  return data as VenueWriteResult;
}

async function resolveManualVenue(
  supabase: AdminSupabaseClient,
  values: MatchFormValues,
) {
  const { data: existingVenue, error: lookupError } = await supabase
    .from("venues")
    .select("id, slug")
    .eq("address", values.address)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingVenue) {
    return existingVenue as VenueWriteResult;
  }

  return createVenue(supabase, {
    name: values.venueName,
    district: values.district,
    address: values.address,
    directions: values.directions,
    parking: values.parking,
    smoking: values.smoking,
    showerLocker: values.showerLocker,
    defaultImageUrls: values.imageUrls,
    defaultRules: values.rules,
    defaultSafetyNotes: values.safetyNotes,
    isActive: true,
  });
}

async function createVenue(
  supabase: AdminSupabaseClient,
  values: VenueWriteValues,
) {
  const slug = toSlug(`${values.district} ${values.name}`);
  const { data, error } = await supabase
    .from("venues")
    .insert({
      slug,
      name: values.name,
      district: values.district,
      address: values.address,
      directions: values.directions,
      parking: values.parking,
      smoking: values.smoking,
      shower_locker: values.showerLocker,
      default_image_urls: values.defaultImageUrls,
      default_rules: values.defaultRules,
      default_safety_notes: values.defaultSafetyNotes,
      is_active: values.isActive,
    })
    .select("id, slug")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save venue");
  }

  return data as VenueWriteResult;
}

async function getConfirmedCount(
  supabase: AdminSupabaseClient,
  matchId: string,
) {
  const { data, error } = await supabase
    .from("match_application_counts")
    .select("confirmed_count")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return ((data as MatchCountResult | null)?.confirmed_count ?? 0);
}

type MatchFormValues = {
  venueEntryMode: AdminVenueEntryMode;
  selectedVenueId: string;
  title: string;
  venueName: string;
  district: string;
  address: string;
  startAt: string;
  endAt: string;
  status: AdminMatchStatus;
  format: AdminMatchFormat;
  capacity: number;
  price: number;
  genderCondition: string;
  levelCondition: string;
  levelRange: string;
  preparation: string;
  summary: string;
  publicNotice: string;
  operatorNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  imageUrls: string[];
  tags: string[];
  rules: string[];
  safetyNotes: string[];
};

function readCreateMatchFormValues(formData: FormData): MatchFormValues {
  const date = getRequiredString(formData, "date");
  const startTime = getRequiredString(formData, "startTime");
  const durationMinutes = getPositiveInteger(formData, "durationMinutes");
  const intent = getCreateMatchIntent(getRequiredString(formData, "intent"));
  const venueEntryMode = getVenueEntryMode(getRequiredString(formData, "venueEntryMode"));
  const format = getFormat(getRequiredString(formData, "format"));
  const venueName = getRequiredString(formData, "venueName");
  const address = getRequiredString(formData, "address");
  const { levelCondition, levelRange } = getMatchLevelValues(
    getLevel(getRequiredString(formData, "level")),
  );
  const startAt = buildSeoulDateTime(date, startTime);
  const endAt = buildMatchEndAt(startAt, durationMinutes);

  return {
    venueEntryMode,
    selectedVenueId: getOptionalString(formData, "selectedVenueId"),
    title:
      getOptionalString(formData, "title") ||
      buildGeneratedMatchTitle({ venueName, format, startTime }),
    venueName,
    district: getDistrict(formData, address),
    address,
    startAt,
    endAt,
    status: intent === "publish_now" ? "open" : "draft",
    format,
    capacity: getPositiveInteger(formData, "capacity"),
    price: getNonNegativeInteger(formData, "price"),
    genderCondition: getRequiredString(formData, "genderCondition"),
    levelCondition,
    levelRange,
    preparation: getOptionalString(formData, "preparation"),
    summary: getOptionalString(formData, "summary"),
    publicNotice: getOptionalString(formData, "publicNotice"),
    operatorNote: getOptionalString(formData, "operatorNote"),
    directions: getOptionalString(formData, "directions"),
    parking: getOptionalString(formData, "parking"),
    smoking: getOptionalString(formData, "smoking"),
    showerLocker: getOptionalString(formData, "showerLocker"),
    imageUrls: splitLineSeparated(getOptionalString(formData, "imageUrlsText")),
    tags: splitCommaSeparated(getOptionalString(formData, "tagsText")),
    rules: splitLineSeparated(getOptionalString(formData, "rulesText")),
    safetyNotes: splitLineSeparated(getOptionalString(formData, "safetyNotesText")),
  };
}

function readUpdateMatchFormValues(formData: FormData): MatchFormValues {
  const date = getRequiredString(formData, "date");
  const startTime = getRequiredString(formData, "startTime");
  const durationMinutes = getPositiveInteger(formData, "durationMinutes");
  getUpdateMatchIntent(getRequiredString(formData, "intent"));
  const venueEntryMode = getVenueEntryMode(getRequiredString(formData, "venueEntryMode"));
  const format = getFormat(getRequiredString(formData, "format"));
  const venueName = getRequiredString(formData, "venueName");
  const address = getRequiredString(formData, "address");
  const { levelCondition, levelRange } = getMatchLevelValues(
    getLevel(getRequiredString(formData, "level")),
  );
  const startAt = buildSeoulDateTime(date, startTime);
  const endAt = buildMatchEndAt(startAt, durationMinutes);

  return {
    venueEntryMode,
    selectedVenueId: getOptionalString(formData, "selectedVenueId"),
    title:
      getOptionalString(formData, "title") ||
      buildGeneratedMatchTitle({ venueName, format, startTime }),
    venueName,
    district: getDistrict(formData, address),
    address,
    startAt,
    endAt,
    status: getStatus(getRequiredString(formData, "status")),
    format,
    capacity: getPositiveInteger(formData, "capacity"),
    price: getNonNegativeInteger(formData, "price"),
    genderCondition: getRequiredString(formData, "genderCondition"),
    levelCondition,
    levelRange,
    preparation: getOptionalString(formData, "preparation"),
    summary: getOptionalString(formData, "summary"),
    publicNotice: getOptionalString(formData, "publicNotice"),
    operatorNote: getOptionalString(formData, "operatorNote"),
    directions: getOptionalString(formData, "directions"),
    parking: getOptionalString(formData, "parking"),
    smoking: getOptionalString(formData, "smoking"),
    showerLocker: getOptionalString(formData, "showerLocker"),
    imageUrls: splitLineSeparated(getOptionalString(formData, "imageUrlsText")),
    tags: splitCommaSeparated(getOptionalString(formData, "tagsText")),
    rules: splitLineSeparated(getOptionalString(formData, "rulesText")),
    safetyNotes: splitLineSeparated(getOptionalString(formData, "safetyNotesText")),
  };
}

function readVenueFormValues(formData: FormData): VenueFormValues {
  return {
    name: getRequiredString(formData, "name"),
    district: getRequiredString(formData, "district"),
    address: getRequiredString(formData, "address"),
    directions: getRequiredString(formData, "directions"),
    parking: getRequiredString(formData, "parking"),
    smoking: getRequiredString(formData, "smoking"),
    showerLocker: getRequiredString(formData, "showerLocker"),
    imageFiles: getUploadedFiles(formData, "imageFiles"),
    imageOrder: parseVenueImageOrder(getOptionalString(formData, "imageOrderJson")),
    defaultRules: splitLineSeparated(getOptionalString(formData, "defaultRulesText")),
    defaultSafetyNotes: splitLineSeparated(getOptionalString(formData, "defaultSafetyNotesText")),
    isActive: formData.get("isActive") === "on",
  };
}

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getPositiveInteger(formData: FormData, key: string) {
  const value = Number.parseInt(getRequiredString(formData, key), 10);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid numeric field: ${key}`);
  }

  return value;
}

function readCouponTemplateFormValues(formData: FormData): CouponTemplateFormValues {
  return {
    discountAmount: getPositiveInteger(formData, "discountAmount"),
    isActive: formData.get("isActive") === "on",
    name: getRequiredString(formData, "name"),
  };
}

function getNonNegativeInteger(formData: FormData, key: string) {
  const value = Number.parseInt(getRequiredString(formData, key), 10);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid numeric field: ${key}`);
  }

  return value;
}

function getStatus(value: string) {
  if (MATCH_STATUSES.includes(value as AdminMatchStatus)) {
    return value as AdminMatchStatus;
  }

  throw new Error("Invalid match status");
}

function getCreateMatchIntent(value: string) {
  if (CREATE_MATCH_INTENTS.includes(value as (typeof CREATE_MATCH_INTENTS)[number])) {
    return value as (typeof CREATE_MATCH_INTENTS)[number];
  }

  throw new Error("Invalid create match intent");
}

function getUpdateMatchIntent(value: string) {
  if (UPDATE_MATCH_INTENTS.includes(value as (typeof UPDATE_MATCH_INTENTS)[number])) {
    return value as (typeof UPDATE_MATCH_INTENTS)[number];
  }

  throw new Error("Invalid update match intent");
}

function getFormat(value: string) {
  if (MATCH_FORMATS.includes(value as AdminMatchFormat)) {
    return value as AdminMatchFormat;
  }

  throw new Error("Invalid match format");
}

function getLevel(value: string) {
  if (MATCH_LEVELS.includes(value as AdminMatchLevelPreset)) {
    return value as AdminMatchLevelPreset;
  }

  throw new Error("Invalid match level");
}

function getVenueEntryMode(value: string) {
  if (VENUE_ENTRY_MODES.includes(value as AdminVenueEntryMode)) {
    return value as AdminVenueEntryMode;
  }

  throw new Error("Invalid venue entry mode");
}

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLineSeparated(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getUploadedFiles(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function parseVenueImageOrder(value: string): VenueImageOrderEntry[] {
  if (!value) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Invalid venue image payload");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid venue image payload");
  }

  return parsed.map((entry) => {
    if (
      entry &&
      typeof entry === "object" &&
      entry.kind === "existing" &&
      typeof entry.url === "string" &&
      entry.url.trim()
    ) {
      return {
        kind: "existing" as const,
        url: entry.url.trim(),
      };
    }

    if (
      entry &&
      typeof entry === "object" &&
      entry.kind === "new" &&
      typeof entry.fileName === "string" &&
      entry.fileName.trim()
    ) {
      return {
        kind: "new" as const,
        fileName: entry.fileName.trim(),
      };
    }

    throw new Error("Invalid venue image payload");
  });
}

function buildSeoulDateTime(date: string, time: string) {
  const iso = `${date}T${time}:00+09:00`;
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date or time");
  }

  return parsed.toISOString();
}

function buildMatchEndAt(startAt: string, durationMinutes: number) {
  const endAt = new Date(new Date(startAt).getTime() + durationMinutes * 60 * 1000);

  if (Number.isNaN(endAt.getTime())) {
    throw new Error("Invalid match duration");
  }

  return endAt.toISOString();
}

function getDistrict(formData: FormData, address: string) {
  return inferDistrictFromAddress(address) || getOptionalString(formData, "district");
}

function buildMatchSlug(venueSlug: string, startAt: string) {
  const startDate = new Date(startAt);
  const date = formatSeoulDateInput(startDate).replaceAll("-", "");
  const time = formatSeoulTime(startDate).replace(":", "");

  return `${venueSlug}-${date}-${time}`;
}

function toSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "venue";
}

function requireServiceRoleClient() {
  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  return admin as any;
}

async function getVenueImageUrls(
  supabase: AdminSupabaseClient,
  venueId: string,
) {
  const { data, error } = await supabase
    .from("venues")
    .select("default_image_urls")
    .eq("id", venueId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return ((data as { default_image_urls: string[] | null } | null)?.default_image_urls ?? []);
}

async function updateVenueImages(
  supabase: AdminSupabaseClient,
  venueId: string,
  defaultImageUrls: string[],
) {
  const { error } = await supabase
    .from("venues")
    .update({
      default_image_urls: defaultImageUrls,
    })
    .eq("id", venueId);

  if (error) {
    throw new Error(error.message);
  }
}

async function cleanupFailedVenueCreation(admin: any, venueId: string) {
  const { error } = await admin.from("venues").delete().eq("id", venueId);

  if (error) {
    throw new Error(error.message);
  }
}

async function safeDeleteVenueImageUrls(admin: any, urls: string[]) {
  if (urls.length === 0) {
    return;
  }

  try {
    await deleteVenueImageUrls(admin, urls);
  } catch {
    // Ignore storage cleanup failures after the main DB write succeeds.
  }
}

function buildVenueImageUrls({
  imageOrder,
  previousUrls,
  uploadedUrls,
}: {
  imageOrder: VenueImageOrderEntry[];
  previousUrls: string[];
  uploadedUrls: Map<string, string>;
}) {
  const previousUrlSet = new Set(previousUrls);
  const seen = new Set<string>();
  const orderedUrls: string[] = [];

  for (const entry of imageOrder) {
    const nextUrl =
      entry.kind === "existing"
        ? validateExistingVenueImageUrl(entry.url, previousUrlSet)
        : uploadedUrls.get(entry.fileName);

    if (!nextUrl) {
      throw new Error("Missing uploaded venue image");
    }

    if (seen.has(nextUrl)) {
      continue;
    }

    seen.add(nextUrl);
    orderedUrls.push(nextUrl);
  }

  if (orderedUrls.length > 8) {
    throw new Error("Venue images cannot exceed 8 files");
  }

  return orderedUrls;
}

function validateExistingVenueImageUrl(url: string, previousUrlSet: Set<string>) {
  if (previousUrlSet.has(url)) {
    return url;
  }

  if (url.startsWith("/")) {
    return url;
  }

  throw new Error("Invalid retained venue image");
}
