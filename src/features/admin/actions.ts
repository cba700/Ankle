"use server";

import { redirect } from "next/navigation";
import { getServerAuthState } from "@/lib/supabase/auth";
import { assertVenueManagementSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
  defaultImageUrls: string[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
  isActive: boolean;
};

type MatchCountResult = {
  confirmed_count: number;
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
    const { error: cancelError } = await supabase
      .from("match_applications")
      .update({
        status: "cancelled_by_admin",
        cancel_reason: "admin_cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("match_id", matchId)
      .eq("status", "confirmed");

    if (cancelError) {
      throw new Error(cancelError.message);
    }
  }

  redirect(`/admin/matches/${matchId}/edit`);
}

export async function createAdminVenueAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const values = readVenueFormValues(formData);
  const venue = await createVenue(supabase, values);

  redirect(`/admin/venues/${venue.id}/edit`);
}

export async function updateAdminVenueAction(venueId: string, formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const values = readVenueFormValues(formData);
  const slug = toSlug(`${values.district} ${values.name}`);

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
      default_image_urls: values.defaultImageUrls,
      default_rules: values.defaultRules,
      default_safety_notes: values.defaultSafetyNotes,
      is_active: values.isActive,
    })
    .eq("id", venueId);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/admin/venues/${venueId}/edit`);
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
  values: VenueFormValues,
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
    defaultImageUrls: splitLineSeparated(getOptionalString(formData, "defaultImageUrlsText")),
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
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(startDate)
    .replaceAll("-", "");
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(startDate)
    .replace(":", "");

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
