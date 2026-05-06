"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formatSeoulDateInput, formatSeoulTime } from "@/lib/date";
import {
  checkAndStoreMatchWeather,
  isRainAlertChangedWindow,
  isRainAlertWindow,
  markRainAlertChangedSent,
  markRainAlertSent,
  markRainCancelled,
} from "@/lib/match-weather";
import {
  cancelMatchReminderNotifications,
  refreshMatchReminderNotifications,
  sendAdminMatchCancelledNotification,
  sendCashRefundProcessedNotification,
  sendNoShowNoticeNotification,
  sendParticipantShortageNoticeDayBeforeNotification,
  sendParticipantShortageNoticeSameDayNotification,
  sendRainChangeNoticeNotification,
  sendRainNoticeNotification,
  sendRainAlertChangedNotifications,
  sendRainAlertNotifications,
  sendRainMatchCancelledNotifications,
} from "@/lib/notifications";
import { retryPendingTossChargeOrder } from "@/lib/payments/toss-charge";
import { buildPlayerLevelValue } from "@/lib/player-levels";
import { getServerAuthState } from "@/lib/supabase/auth";
import {
  assertAccountWithdrawalSchemaReady,
  assertAdminPlayerLevelSchemaReady,
  assertCashChargeOperationsSchemaReady,
  assertCouponSchemaReady,
  assertCashRefundRequestSchemaReady,
  assertHomeBannerSchemaReady,
  assertNotificationDispatchSchemaReady,
  assertVenueManagementSchemaReady,
} from "@/lib/supabase/schema";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import {
  deleteHomeBannerImageUrls,
  isManagedHomeBannerImageUrl,
  uploadHomeBannerImageFile,
} from "@/lib/banner-images";
import { getAdminHomeBannerById } from "@/lib/home-banners";
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
  AdminMatchRefundExceptionMode,
  AdminMatchStatus,
  AdminVenueEntryMode,
} from "./types";

type VenueWriteResult = {
  id: string;
  slug: string;
  courtNote: string | null;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
};

type VenueWriteRow = {
  id: string;
  slug: string;
  court_note: string | null;
  weather_grid_nx: number | null;
  weather_grid_ny: number | null;
};

type VenueFormValues = {
  name: string;
  district: string;
  address: string;
  courtNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
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
  courtNote: string;
  directions: string;
  parking: string;
  smoking: string;
  showerLocker: string;
  weatherGridNx: number | null;
  weatherGridNy: number | null;
  defaultImageUrls: string[];
  defaultRules: string[];
  defaultSafetyNotes: string[];
  isActive: boolean;
};

type HomeBannerFormValues = {
  title: string;
  href: string | null;
  displayOrder: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  imageFile: File | null;
};

type HomeBannerOrderRow = {
  id: string;
  display_order: number;
  created_at: string;
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

type MatchNotificationSnapshot = {
  address: string;
  end_at: string;
  start_at: string;
  title: string;
  venue_name: string;
};

type CouponTemplateFormValues = {
  discountAmount: number;
  isActive: boolean;
  name: string;
};

const REQUIRED_COUPON_DELETE_MIGRATION =
  "20260415153000_allow_admin_delete_coupon_templates.sql";
const REQUIRED_MATCH_VENUE_DELETE_MIGRATION =
  "20260420110000_allow_admin_delete_matches_and_venues.sql";

const MATCH_STATUSES: AdminMatchStatus[] = ["draft", "open", "closed", "cancelled"];
const MATCH_FORMATS: AdminMatchFormat[] = ["3vs3", "5vs5"];
const MATCH_LEVELS: AdminMatchLevelPreset[] = ["all", "basic", "middle", "high"];
const MATCH_REFUND_EXCEPTION_MODES: AdminMatchRefundExceptionMode[] = [
  "none",
  "participant_shortage_day_before",
  "participant_shortage_same_day",
  "rain_notice",
  "rain_change_notice",
];
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
      court_note: normalizeOptionalText(values.courtNote) ?? venue.courtNote,
      directions: "",
      parking: "",
      smoking: "",
      shower_locker: "",
      weather_grid_nx: values.weatherGridNx ?? venue.weatherGridNx,
      weather_grid_ny: values.weatherGridNy ?? venue.weatherGridNy,
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
  const [previousMatch, confirmedApplicationIds] = await Promise.all([
    getMatchNotificationSnapshot(supabase, matchId),
    listConfirmedApplicationIds(supabase, matchId),
  ]);

  if (values.capacity < confirmedCount) {
    throw new Error("Capacity cannot be lower than the current confirmed participants");
  }

  const slug = buildMatchSlug(venue.slug, values.startAt);
  const shouldRefreshReminders =
    values.status !== "cancelled" &&
    hasNotificationContentChanged(previousMatch, values);

  const { error } = await supabase
    .from("matches")
    .update({
      venue_id: venue.id,
      slug,
      venue_name: values.venueName,
      district: values.district,
      address: values.address,
      court_note: normalizeOptionalText(values.courtNote),
      directions: "",
      parking: "",
      smoking: "",
      shower_locker: "",
      weather_grid_nx: values.weatherGridNx ?? venue.weatherGridNx,
      weather_grid_ny: values.weatherGridNy ?? venue.weatherGridNy,
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
      ...(values.status === "cancelled"
        ? { refund_exception_mode: "none" }
        : {}),
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

    await Promise.all(
      confirmedApplicationIds.map(async (applicationId) => {
        await cancelMatchReminderNotifications(applicationId);
        await sendAdminMatchCancelledNotification(applicationId);
      }),
    );
  } else if (shouldRefreshReminders) {
    await Promise.all(
      confirmedApplicationIds.map((applicationId) =>
        refreshMatchReminderNotifications(applicationId),
      ),
    );
  }

  redirect(`/admin/matches/${matchId}/edit`);
}

export async function deleteAdminMatchAction(matchId: string, _formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const applicationCount = await getMatchApplicationCount(supabase, matchId);

  if (applicationCount > 0) {
    throw new Error("신청/참가 이력이 있는 매치는 삭제할 수 없습니다. 운영 취소를 사용해 주세요.");
  }

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) {
    if (isDeletePermissionError(error)) {
      throw new Error(
        `Database schema is outdated. Apply migration ${REQUIRED_MATCH_VENUE_DELETE_MIGRATION} before deleting matches and venues.`,
      );
    }

    throw new Error(`Failed to delete match: ${error.message}`);
  }

  revalidateAdminMatchPaths(matchId);
  redirect("/admin/matches");
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
    courtNote: values.courtNote,
    directions: "",
    parking: "",
    smoking: "",
    showerLocker: "",
    weatherGridNx: values.weatherGridNx,
    weatherGridNy: values.weatherGridNy,
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
        court_note: normalizeOptionalText(values.courtNote),
        directions: "",
        parking: "",
        smoking: "",
        shower_locker: "",
        weather_grid_nx: values.weatherGridNx,
        weather_grid_ny: values.weatherGridNy,
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

export async function deleteAdminVenueAction(venueId: string, _formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertVenueManagementSchemaReady(supabase);
  const matchCount = await getVenueMatchCount(supabase, venueId);

  if (matchCount > 0) {
    throw new Error("이 경기장으로 생성된 매치가 있어 삭제할 수 없습니다. 비활성화로 보관해 주세요.");
  }

  const imageUrls = await getVenueImageUrls(supabase, venueId);
  const { error } = await supabase.from("venues").delete().eq("id", venueId);

  if (error) {
    if (isDeletePermissionError(error)) {
      throw new Error(
        `Database schema is outdated. Apply migration ${REQUIRED_MATCH_VENUE_DELETE_MIGRATION} before deleting matches and venues.`,
      );
    }

    if (error.code === "23503" || error.message?.includes("violates foreign key constraint")) {
      throw new Error("이 경기장으로 생성된 매치가 있어 삭제할 수 없습니다. 비활성화로 보관해 주세요.");
    }

    throw new Error(`Failed to delete venue: ${error.message}`);
  }

  const admin = getSupabaseServiceRoleClient() as any;

  if (admin) {
    await safeDeleteVenueImageUrls(
      admin,
      imageUrls.filter((url) => isManagedVenueImageUrl(url)),
    );
  }

  revalidateAdminVenuePaths(venueId);
  redirect("/admin/venues");
}

export async function createAdminHomeBannerAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertHomeBannerSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const values = readHomeBannerFormValues(formData, { requireImage: true });

  if (!values.imageFile) {
    throw new Error("배너 이미지를 등록해 주세요.");
  }

  const bannerId = crypto.randomUUID();
  let uploadedUrl = "";

  try {
    uploadedUrl = await uploadHomeBannerImageFile(admin, {
      bannerId,
      file: values.imageFile,
    });
    const displayOrder = await getHomeBannerInsertDisplayOrder(
      supabase,
      values.displayOrder,
    );

    const { error } = await ((supabase.from("home_banners" as any) as any).insert({
      display_order: displayOrder,
      ends_at: values.endsAt,
      href: values.href,
      id: bannerId,
      image_url: uploadedUrl,
      is_active: values.isActive,
      starts_at: values.startsAt,
      title: values.title,
    }));

    if (error) {
      throw new Error(`Failed to create home banner: ${error.message}`);
    }
  } catch (error) {
    await safeDeleteHomeBannerImageUrls(admin, uploadedUrl ? [uploadedUrl] : []);
    throw error;
  }

  await reorderAdminHomeBanners(supabase, bannerId, values.displayOrder);
  revalidateAdminHomeBannerPaths();
  redirect("/admin/banners");
}

export async function updateAdminHomeBannerAction(bannerId: string, formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertHomeBannerSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const currentBanner = await getAdminHomeBannerById(supabase, bannerId);

  if (!currentBanner) {
    throw new Error("배너를 찾을 수 없습니다.");
  }

  const values = readHomeBannerFormValues(formData, { requireImage: false });
  let uploadedUrl = "";
  let nextImageUrl = currentBanner.imageUrl;

  try {
    if (values.imageFile) {
      uploadedUrl = await uploadHomeBannerImageFile(admin, {
        bannerId,
        file: values.imageFile,
      });
      nextImageUrl = uploadedUrl;
    }

    const { error } = await ((supabase.from("home_banners" as any) as any)
      .update({
        ends_at: values.endsAt,
        href: values.href,
        image_url: nextImageUrl,
        is_active: values.isActive,
        starts_at: values.startsAt,
        title: values.title,
      })
      .eq("id", bannerId));

    if (error) {
      throw new Error(`Failed to update home banner: ${error.message}`);
    }
  } catch (error) {
    await safeDeleteHomeBannerImageUrls(admin, uploadedUrl ? [uploadedUrl] : []);
    throw error;
  }

  if (
    uploadedUrl &&
    currentBanner.imageUrl !== nextImageUrl &&
    isManagedHomeBannerImageUrl(currentBanner.imageUrl)
  ) {
    await safeDeleteHomeBannerImageUrls(admin, [currentBanner.imageUrl]);
  }

  await reorderAdminHomeBanners(supabase, bannerId, values.displayOrder);
  revalidateAdminHomeBannerPaths();
  redirect("/admin/banners");
}

export async function deleteAdminHomeBannerAction(bannerId: string, _formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertHomeBannerSchemaReady(supabase);
  const banner = await getAdminHomeBannerById(supabase, bannerId);

  if (!banner) {
    redirect("/admin/banners");
  }

  const { error } = await ((supabase.from("home_banners" as any) as any)
    .delete()
    .eq("id", bannerId));

  if (error) {
    throw new Error(`Failed to delete home banner: ${error.message}`);
  }

  if (isManagedHomeBannerImageUrl(banner.imageUrl)) {
    const admin = requireServiceRoleClient();
    await safeDeleteHomeBannerImageUrls(admin, [banner.imageUrl]);
  }

  await normalizeAdminHomeBannerOrders(supabase);
  revalidateAdminHomeBannerPaths();
  redirect("/admin/banners");
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
  await assertAccountWithdrawalSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    throw new Error("Refund request ID is required");
  }

  const linkedWithdrawalRequest = await getLinkedPendingWithdrawalRequestByRefundRequestId(
    admin,
    requestId,
  );

  const { error } = await admin.rpc("approve_cash_refund_request", {
    p_note: null,
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (linkedWithdrawalRequest) {
    const { error: finalizeError } = await admin.rpc("finalize_account_withdrawal", {
      p_withdrawal_request_id: linkedWithdrawalRequest.id,
    });

    if (finalizeError) {
      throw new Error(finalizeError.message);
    }
  }

  await sendCashRefundProcessedNotification(requestId);

  redirect("/admin/cash");
}

export async function rejectCashRefundRequestAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCashRefundRequestSchemaReady(supabase);
  await assertAccountWithdrawalSchemaReady(supabase);
  const admin = requireServiceRoleClient();
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    throw new Error("Refund request ID is required");
  }

  const linkedWithdrawalRequest = await getLinkedPendingWithdrawalRequestByRefundRequestId(
    admin,
    requestId,
  );

  const { error } = await admin.rpc("reject_cash_refund_request", {
    p_note: null,
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (linkedWithdrawalRequest) {
    const { error: cancelError } = await admin.rpc("cancel_account_withdrawal", {
      p_withdrawal_request_id: linkedWithdrawalRequest.id,
    });

    if (cancelError) {
      throw new Error(cancelError.message);
    }
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

export async function sendAdminNoShowNoticeAction(formData: FormData) {
  await requireAdminSupabase();
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  await sendNoShowNoticeNotification(applicationId);

  revalidatePath("/admin");
  revalidatePath("/admin/matches");
}

async function sendRefundExceptionNotification(
  applicationId: string,
  refundExceptionMode: AdminMatchRefundExceptionMode,
) {
  switch (refundExceptionMode) {
    case "participant_shortage_day_before":
      await sendParticipantShortageNoticeDayBeforeNotification(applicationId);
      return;
    case "participant_shortage_same_day":
      await sendParticipantShortageNoticeSameDayNotification(applicationId);
      return;
    case "rain_notice":
      await sendRainNoticeNotification(applicationId);
      return;
    case "rain_change_notice":
      await sendRainChangeNoticeNotification(applicationId);
      return;
    case "none":
    default:
      return;
  }
}

export async function setAdminMatchRefundExceptionAction(
  matchId: string,
  formData: FormData,
) {
  const supabase = await requireAdminSupabase();
  await assertCouponSchemaReady(supabase);
  const refundExceptionMode = getRefundExceptionMode(
    getRequiredString(formData, "refundExceptionMode"),
  );
  const confirmedApplicationIds = await listConfirmedApplicationIds(supabase, matchId);

  const { error } = await supabase
    .from("matches")
    .update({
      refund_exception_mode: refundExceptionMode,
    })
    .eq("id", matchId);

  if (error) {
    throw new Error(`Failed to update refund exception mode: ${error.message}`);
  }

  if (refundExceptionMode !== "none") {
    await Promise.all(
      confirmedApplicationIds.map((applicationId) =>
        sendRefundExceptionNotification(applicationId, refundExceptionMode),
      ),
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}/edit`);
  redirect(`/admin/matches/${matchId}/edit`);
}

export async function issueAdminRainChangeRefundAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCouponSchemaReady(supabase);
  const applicationId = String(formData.get("applicationId") ?? "").trim();

  if (!applicationId) {
    throw new Error("Application ID is required");
  }

  const { data, error } = await supabase.rpc("cancel_match_application_by_admin", {
    p_application_id: applicationId,
    p_reason: "admin_rain_change_refund",
  });

  if (error) {
    throw new Error(error.message);
  }

  const responsePayload = { ...(data ?? {}) } as {
    applicationId?: unknown;
  };

  if (typeof responsePayload.applicationId === "string" && responsePayload.applicationId) {
    await Promise.all([
      cancelMatchReminderNotifications(responsePayload.applicationId),
      sendAdminMatchCancelledNotification(responsePayload.applicationId),
    ]);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/matches");
}

export async function checkAdminMatchWeatherAction(matchId: string) {
  const supabase = await requireAdminSupabase();
  await assertNotificationDispatchSchemaReady(supabase);
  await checkAndStoreMatchWeather(matchId, supabase);
  revalidateAdminMatchPaths(matchId);
}

export async function sendAdminMatchRainAlertAction(matchId: string) {
  const supabase = await requireAdminSupabase();
  requireServiceRoleClient();
  await assertNotificationDispatchSchemaReady(supabase);
  const { data } = await checkAndStoreMatchWeather(matchId, supabase);
  const precipitationMm = data.lastPrecipitationMm ?? 0;

  if (data.status === "cancelled") {
    throw new Error("이미 취소된 매치입니다.");
  }

  if (data.rainAlertSentAt) {
    throw new Error("강우 안내 알림이 이미 발송되었습니다.");
  }

  if (!isRainAlertWindow(data.startAt)) {
    throw new Error("매치 시작 2시간 전까지만 강우 안내 알림을 보낼 수 있습니다.");
  }

  if (precipitationMm < 1) {
    throw new Error("시간당 강수 예보가 1mm 미만입니다.");
  }

  await sendRainAlertNotifications(matchId, precipitationMm);
  await markRainAlertSent(matchId, supabase);
  revalidateAdminMatchPaths(matchId);
}

export async function sendAdminMatchRainAlertChangedAction(matchId: string) {
  const supabase = await requireAdminSupabase();
  requireServiceRoleClient();
  await assertNotificationDispatchSchemaReady(supabase);
  const { data, previousPrecipitationMm } = await checkAndStoreMatchWeather(matchId, supabase);
  const precipitationMm = data.lastPrecipitationMm ?? 0;

  if (data.status === "cancelled") {
    throw new Error("이미 취소된 매치입니다.");
  }

  if (data.rainAlertChangedSentAt) {
    throw new Error("강수 변동 알림이 이미 발송되었습니다.");
  }

  if (!isRainAlertChangedWindow(data.startAt)) {
    throw new Error("매치 시작 2시간 이내에만 강수 변동 알림을 보낼 수 있습니다.");
  }

  if (precipitationMm < 1) {
    throw new Error("시간당 강수 예보가 1mm 미만입니다.");
  }

  if (previousPrecipitationMm === null) {
    throw new Error("직전 예보 점검 이력이 없어 변동 알림을 보낼 수 없습니다.");
  }

  if (previousPrecipitationMm >= 1) {
    throw new Error("직전 예보가 이미 1mm 이상이라 변동 알림 대상이 아닙니다.");
  }

  await sendRainAlertChangedNotifications(matchId, precipitationMm);
  await markRainAlertChangedSent(matchId, supabase);
  revalidateAdminMatchPaths(matchId);
}

export async function cancelAdminMatchForRainAction(matchId: string) {
  const supabase = await requireAdminSupabase();
  requireServiceRoleClient();
  await assertNotificationDispatchSchemaReady(supabase);
  const { data } = await checkAndStoreMatchWeather(matchId, supabase);
  const precipitationMm = data.lastPrecipitationMm ?? 0;
  const confirmedApplicationIds = await listConfirmedApplicationIds(supabase, matchId);

  if (data.status === "cancelled") {
    throw new Error("이미 취소된 매치입니다.");
  }

  if (precipitationMm < 3) {
    throw new Error("시간당 강수 예보가 3mm 미만이라 강우 취소 대상이 아닙니다.");
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: "cancelled",
    })
    .eq("id", matchId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: cancelError } = await supabase.rpc(
    "cancel_match_applications_by_admin",
    {
      p_match_id: matchId,
    },
  );

  if (cancelError) {
    throw new Error(cancelError.message);
  }

  await Promise.all(
    confirmedApplicationIds.map((applicationId) =>
      cancelMatchReminderNotifications(applicationId),
    ),
  );
  await sendRainMatchCancelledNotifications(matchId, precipitationMm);
  await markRainCancelled(matchId, supabase);
  revalidateAdminMatchPaths(matchId);
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

export async function deleteAdminCouponTemplateAction(formData: FormData) {
  const supabase = await requireAdminSupabase();
  await assertCouponSchemaReady(supabase);
  const templateId = String(formData.get("templateId") ?? "").trim();

  if (!templateId) {
    throw new Error("Coupon template ID is required");
  }

  const { error } = await ((supabase.from("coupon_templates" as any) as any)
    .delete()
    .eq("id", templateId));

  if (error) {
    if (
      error.code === "42501" ||
      error.message?.includes("permission denied") ||
      error.message?.includes("new row violates row-level security policy")
    ) {
      throw new Error(
        `Database schema is outdated. Apply migration ${REQUIRED_COUPON_DELETE_MIGRATION} before deleting coupon templates.`,
      );
    }

    throw new Error(`Failed to delete coupon template: ${error.message}`);
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
    .select("id, slug, court_note, weather_grid_nx, weather_grid_ny")
    .eq("id", venueId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to load venue");
  }

  return mapVenueWriteResult(data as VenueWriteRow);
}

async function resolveManualVenue(
  supabase: AdminSupabaseClient,
  values: MatchFormValues,
) {
  const { data: existingVenue, error: lookupError } = await supabase
    .from("venues")
    .select("id, slug, court_note, weather_grid_nx, weather_grid_ny")
    .eq("address", values.address)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existingVenue) {
    return mapVenueWriteResult(existingVenue as VenueWriteRow);
  }

  return createVenue(supabase, {
    name: values.venueName,
    district: values.district,
    address: values.address,
    courtNote: values.courtNote,
    directions: "",
    parking: "",
    smoking: "",
    showerLocker: "",
    weatherGridNx: values.weatherGridNx,
    weatherGridNy: values.weatherGridNy,
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
      court_note: normalizeOptionalText(values.courtNote),
      directions: "",
      parking: "",
      smoking: "",
      shower_locker: "",
      weather_grid_nx: values.weatherGridNx,
      weather_grid_ny: values.weatherGridNy,
      default_image_urls: values.defaultImageUrls,
      default_rules: values.defaultRules,
      default_safety_notes: values.defaultSafetyNotes,
      is_active: values.isActive,
    })
    .select("id, slug, court_note, weather_grid_nx, weather_grid_ny")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save venue");
  }

  return mapVenueWriteResult(data as VenueWriteRow);
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

async function getMatchApplicationCount(
  supabase: AdminSupabaseClient,
  matchId: string,
) {
  const { count, error } = await supabase
    .from("match_applications")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);

  if (error) {
    throw new Error(`Failed to load match applications: ${error.message}`);
  }

  return count ?? 0;
}

async function getVenueMatchCount(
  supabase: AdminSupabaseClient,
  venueId: string,
) {
  const { count, error } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("venue_id", venueId);

  if (error) {
    throw new Error(`Failed to load venue matches: ${error.message}`);
  }

  return count ?? 0;
}

async function listConfirmedApplicationIds(
  supabase: AdminSupabaseClient,
  matchId: string,
) {
  const { data, error } = await supabase
    .from("match_applications")
    .select("id")
    .eq("match_id", matchId)
    .eq("status", "confirmed");

  if (error) {
    throw new Error(`Failed to load confirmed applications: ${error.message}`);
  }

  return ((data ?? []) as { id: string }[]).map((row) => row.id);
}

async function getMatchNotificationSnapshot(
  supabase: AdminSupabaseClient,
  matchId: string,
) {
  const { data, error } = await supabase
    .from("matches")
    .select("title, venue_name, address, start_at, end_at")
    .eq("id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load match snapshot: ${error.message}`);
  }

  return (data ?? null) as MatchNotificationSnapshot | null;
}

function hasNotificationContentChanged(
  previousMatch: MatchNotificationSnapshot | null,
  nextValues: MatchFormValues,
) {
  if (!previousMatch) {
    return false;
  }

  return (
    previousMatch.title !== nextValues.title ||
    previousMatch.venue_name !== nextValues.venueName ||
    previousMatch.address !== nextValues.address ||
    previousMatch.start_at !== nextValues.startAt ||
    previousMatch.end_at !== nextValues.endAt
  );
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
  weatherGridNx: number | null;
  weatherGridNy: number | null;
  summary: string;
  publicNotice: string;
  operatorNote: string;
  courtNote: string;
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
    weatherGridNx: getOptionalPositiveInteger(formData, "weatherGridNx"),
    weatherGridNy: getOptionalPositiveInteger(formData, "weatherGridNy"),
    summary: getOptionalString(formData, "summary"),
    publicNotice: getOptionalString(formData, "publicNotice"),
    operatorNote: getOptionalString(formData, "operatorNote"),
    courtNote: getOptionalString(formData, "courtNote"),
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
    weatherGridNx: getOptionalPositiveInteger(formData, "weatherGridNx"),
    weatherGridNy: getOptionalPositiveInteger(formData, "weatherGridNy"),
    summary: getOptionalString(formData, "summary"),
    publicNotice: getOptionalString(formData, "publicNotice"),
    operatorNote: getOptionalString(formData, "operatorNote"),
    courtNote: getOptionalString(formData, "courtNote"),
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
    courtNote: getOptionalString(formData, "courtNote"),
    directions: getOptionalString(formData, "directions"),
    parking: getOptionalString(formData, "parking"),
    smoking: getOptionalString(formData, "smoking"),
    showerLocker: getOptionalString(formData, "showerLocker"),
    weatherGridNx: getOptionalPositiveInteger(formData, "weatherGridNx"),
    weatherGridNy: getOptionalPositiveInteger(formData, "weatherGridNy"),
    imageFiles: getUploadedFiles(formData, "imageFiles"),
    imageOrder: parseVenueImageOrder(getOptionalString(formData, "imageOrderJson")),
    defaultRules: splitLineSeparated(getOptionalString(formData, "defaultRulesText")),
    defaultSafetyNotes: splitLineSeparated(getOptionalString(formData, "defaultSafetyNotesText")),
    isActive: formData.get("isActive") === "on",
  };
}

function readHomeBannerFormValues(
  formData: FormData,
  { requireImage }: { requireImage: boolean },
): HomeBannerFormValues {
  const imageFile = getUploadedFiles(formData, "imageFile")[0] ?? null;
  const alwaysVisible = formData.get("alwaysVisible") === "on";
  const startsAt = alwaysVisible
    ? null
    : getRequiredSeoulDateTimeLocal(formData, "startsAt");
  const endsAt = alwaysVisible
    ? null
    : getRequiredSeoulDateTimeLocal(formData, "endsAt");

  if (requireImage && !imageFile) {
    throw new Error("Missing required field: imageFile");
  }

  if (startsAt && endsAt && new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    throw new Error("배너 종료 시각은 시작 시각보다 늦어야 합니다.");
  }

  return {
    displayOrder: getOptionalPositiveInteger(formData, "displayOrder"),
    endsAt,
    href: getOptionalInternalHref(getOptionalString(formData, "href")),
    imageFile,
    isActive: formData.get("isActive") === "on",
    startsAt,
    title: getRequiredString(formData, "title"),
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

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
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

function getOptionalPositiveInteger(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric field: ${key}`);
  }

  return parsed;
}

function getOptionalInternalHref(value: string) {
  if (!value) {
    return null;
  }

  if (value === "/" || (value.startsWith("/") && !value.startsWith("//"))) {
    return value;
  }

  throw new Error("배너 링크는 /로 시작하는 내부 경로만 입력할 수 있습니다.");
}

function getRequiredSeoulDateTimeLocal(formData: FormData, key: string) {
  const value = getOptionalSeoulDateTimeLocal(formData, key);

  if (!value) {
    throw new Error(`Missing required field: ${key}`);
  }

  return value;
}

function getOptionalSeoulDateTimeLocal(formData: FormData, key: string) {
  const value = getOptionalString(formData, key);

  if (!value) {
    return null;
  }

  const valueWithSeconds = value.length === 16 ? `${value}:00` : value;
  const parsed = new Date(`${valueWithSeconds}+09:00`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date time field: ${key}`);
  }

  return parsed.toISOString();
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

function getRefundExceptionMode(value: string) {
  if (MATCH_REFUND_EXCEPTION_MODES.includes(value as AdminMatchRefundExceptionMode)) {
    return value as AdminMatchRefundExceptionMode;
  }

  throw new Error("Invalid refund exception mode");
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

function mapVenueWriteResult(row: VenueWriteRow): VenueWriteResult {
  return {
    id: row.id,
    slug: row.slug,
    courtNote: normalizeOptionalText(row.court_note ?? ""),
    weatherGridNx: row.weather_grid_nx,
    weatherGridNy: row.weather_grid_ny,
  };
}

function requireServiceRoleClient() {
  const admin = getSupabaseServiceRoleClient();

  if (!admin) {
    throw new Error("Service role is not configured");
  }

  return admin as any;
}

async function getLinkedPendingWithdrawalRequestByRefundRequestId(
  admin: ReturnType<typeof requireServiceRoleClient>,
  refundRequestId: string,
) {
  const { data, error } = await (admin.from("account_withdrawal_requests" as any) as any)
    .select("id")
    .eq("refund_request_id", refundRequestId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load linked withdrawal request: ${error.message}`);
  }

  return typeof data?.id === "string" ? { id: data.id } : null;
}

function revalidateAdminMatchPaths(matchId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${matchId}/edit`);
}

function revalidateAdminVenuePaths(venueId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/matches/new");
  revalidatePath(`/admin/venues/${venueId}/edit`);
}

function revalidateAdminHomeBannerPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/banners");
}

async function getHomeBannerInsertDisplayOrder(
  supabase: AdminSupabaseClient,
  requestedDisplayOrder: number | null,
) {
  if (requestedDisplayOrder !== null) {
    return requestedDisplayOrder;
  }

  const rows = await listHomeBannerOrderRows(supabase);
  return rows.length + 1;
}

async function reorderAdminHomeBanners(
  supabase: AdminSupabaseClient,
  movedBannerId: string,
  requestedDisplayOrder: number | null,
) {
  const rows = await listHomeBannerOrderRows(supabase);
  const movedRow = rows.find((row) => row.id === movedBannerId);

  if (!movedRow) {
    return;
  }

  const orderedRows = rows.filter((row) => row.id !== movedBannerId);
  const targetOrder = requestedDisplayOrder ?? rows.length;
  const targetIndex = Math.min(Math.max(targetOrder, 1), rows.length) - 1;

  orderedRows.splice(targetIndex, 0, movedRow);
  await updateHomeBannerDisplayOrders(supabase, orderedRows);
}

async function normalizeAdminHomeBannerOrders(supabase: AdminSupabaseClient) {
  await updateHomeBannerDisplayOrders(supabase, await listHomeBannerOrderRows(supabase));
}

async function listHomeBannerOrderRows(supabase: AdminSupabaseClient) {
  const { data, error } = await ((supabase.from("home_banners" as any) as any)
    .select("id, display_order, created_at")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true }));

  if (error) {
    throw new Error(`Failed to load home banner order: ${error.message}`);
  }

  return (data ?? []) as HomeBannerOrderRow[];
}

async function updateHomeBannerDisplayOrders(
  supabase: AdminSupabaseClient,
  rows: HomeBannerOrderRow[],
) {
  for (const [index, row] of rows.entries()) {
    const nextDisplayOrder = index + 1;

    if (row.display_order === nextDisplayOrder) {
      continue;
    }

    const { error } = await ((supabase.from("home_banners" as any) as any)
      .update({ display_order: nextDisplayOrder })
      .eq("id", row.id));

    if (error) {
      throw new Error(`Failed to update home banner order: ${error.message}`);
    }
  }
}

function isDeletePermissionError(error: { code?: string; message?: string | null }) {
  return (
    error.code === "42501" ||
    error.message?.includes("permission denied") ||
    error.message?.includes("new row violates row-level security policy") ||
    error.message?.includes("violates row-level security policy")
  );
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

async function safeDeleteHomeBannerImageUrls(admin: any, urls: string[]) {
  if (urls.length === 0) {
    return;
  }

  try {
    await deleteHomeBannerImageUrls(admin, urls);
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
