import "server-only";

import { getSupabaseServerClient } from "./server";

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

const REQUIRED_MIGRATION =
  "20260403190000_close_started_open_matches.sql";
const REQUIRED_PUBLIC_ID_MIGRATION =
  "20260410123000_add_match_public_id.sql";
const REQUIRED_CASH_MIGRATION =
  "20260407120000_add_cash_foundation.sql";
const REQUIRED_CHARGE_OPERATIONS_MIGRATION =
  "20260407223000_add_toss_charge_operations.sql";
const REQUIRED_WISHLIST_MIGRATION =
  "20260410153000_add_match_wishlist_items.sql";
const REQUIRED_PROFILE_ONBOARDING_MIGRATION =
  "20260414103000_add_profile_onboarding_preferences.sql";
const REQUIRED_CASH_REFUND_REQUEST_MIGRATION =
  "20260504120000_add_original_payment_cash_refunds.sql";
const REQUIRED_PHONE_AUTH_MIGRATION =
  "20260414153000_add_phone_auth_and_email_login.sql";
const REQUIRED_SIGNUP_PROFILE_MIGRATION =
  "20260414203000_add_signup_profile_and_consents.sql";
const REQUIRED_ADMIN_PLAYER_LEVEL_MIGRATION =
  "20260414233000_add_admin_player_level.sql";
const REQUIRED_ADMIN_MATCH_PARTICIPANTS_MIGRATION =
  "20260414234500_add_admin_match_participants_rpc.sql";
const REQUIRED_COUPON_MIGRATION =
  "20260415123000_support_multiple_signup_coupons.sql";
const REQUIRED_NOTIFICATION_DISPATCH_MIGRATION =
  "20260416153000_add_match_refund_exceptions.sql";
const REQUIRED_REFUND_POLICY_RUNTIME_MIGRATION =
  "20260416153000_add_match_refund_exceptions.sql";
const REQUIRED_ACCOUNT_WITHDRAWAL_MIGRATION =
  "20260416110000_add_account_withdrawal.sql";
const REQUIRED_MATCH_WEATHER_MIGRATION =
  "20260416143000_add_match_weather_and_notification_events.sql";
const REQUIRED_HOME_BANNER_MIGRATION =
  "20260506120000_add_home_banners.sql";

const REQUIRED_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_MIGRATION} before running venue and match features.`;
const REQUIRED_PUBLIC_ID_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_PUBLIC_ID_MIGRATION} before running public match routes.`;
const REQUIRED_CASH_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_CASH_MIGRATION} before running cash-backed application features.`;
const REQUIRED_CHARGE_OPERATIONS_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_CHARGE_OPERATIONS_MIGRATION} before running Toss charge features.`;
const REQUIRED_WISHLIST_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_WISHLIST_MIGRATION} before running match wishlist features.`;
const REQUIRED_PROFILE_ONBOARDING_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_PROFILE_ONBOARDING_MIGRATION} before running onboarding preference features.`;
const REQUIRED_CASH_REFUND_REQUEST_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_CASH_REFUND_REQUEST_MIGRATION} before running cash refund request features.`;
const REQUIRED_PHONE_AUTH_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_PHONE_AUTH_MIGRATION} before running phone verification and email auth features.`;
const REQUIRED_SIGNUP_PROFILE_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_SIGNUP_PROFILE_MIGRATION} before running signup profile and consent features.`;
const REQUIRED_ADMIN_PLAYER_LEVEL_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_ADMIN_PLAYER_LEVEL_MIGRATION} before running admin player level features.`;
const REQUIRED_ADMIN_MATCH_PARTICIPANTS_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_ADMIN_MATCH_PARTICIPANTS_MIGRATION} before running admin participant features.`;
const REQUIRED_COUPON_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_COUPON_MIGRATION} before running coupon features.`;
const REQUIRED_NOTIFICATION_DISPATCH_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_NOTIFICATION_DISPATCH_MIGRATION} before running notification features.`;
const REQUIRED_REFUND_POLICY_RUNTIME_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_REFUND_POLICY_RUNTIME_MIGRATION} before running refund exception features.`;
const REQUIRED_ACCOUNT_WITHDRAWAL_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_ACCOUNT_WITHDRAWAL_MIGRATION} before running account withdrawal features.`;
const REQUIRED_MATCH_WEATHER_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_MATCH_WEATHER_MIGRATION} before running venue weather and match weather features.`;
const REQUIRED_HOME_BANNER_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_HOME_BANNER_MIGRATION} before running home banner features.`;

let schemaCheckPromise: Promise<void> | null = null;
let publicIdSchemaCheckPromise: Promise<void> | null = null;
let cashSchemaCheckPromise: Promise<void> | null = null;
let chargeOperationsCheckPromise: Promise<void> | null = null;
let wishlistSchemaCheckPromise: Promise<void> | null = null;
let profileOnboardingSchemaCheckPromise: Promise<void> | null = null;
let cashRefundRequestSchemaCheckPromise: Promise<void> | null = null;
let signupProfileSchemaCheckPromise: Promise<void> | null = null;
let adminPlayerLevelSchemaCheckPromise: Promise<void> | null = null;
let adminMatchParticipantsSchemaCheckPromise: Promise<void> | null = null;
let couponSchemaCheckPromise: Promise<void> | null = null;
let notificationDispatchSchemaCheckPromise: Promise<void> | null = null;
let accountWithdrawalSchemaCheckPromise: Promise<void> | null = null;
let homeBannerSchemaCheckPromise: Promise<void> | null = null;

export async function assertVenueManagementSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!schemaCheckPromise) {
    schemaCheckPromise = runVenueManagementSchemaCheck(client).catch((error) => {
      schemaCheckPromise = null;
      throw error;
    });
  }

  return schemaCheckPromise;
}

export async function assertCashFoundationSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!cashSchemaCheckPromise) {
    cashSchemaCheckPromise = runCashSchemaCheck(client).catch((error) => {
      cashSchemaCheckPromise = null;
      throw error;
    });
  }

  return cashSchemaCheckPromise;
}

export async function assertPublicMatchRoutingSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!publicIdSchemaCheckPromise) {
    publicIdSchemaCheckPromise = runPublicIdSchemaCheck(client).catch((error) => {
      publicIdSchemaCheckPromise = null;
      throw error;
    });
  }

  return publicIdSchemaCheckPromise;
}

export async function assertCashChargeOperationsSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!chargeOperationsCheckPromise) {
    chargeOperationsCheckPromise = runChargeOperationsSchemaCheck(client).catch(
      (error) => {
        chargeOperationsCheckPromise = null;
        throw error;
      },
    );
  }

  return chargeOperationsCheckPromise;
}

export async function assertMatchWishlistSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!wishlistSchemaCheckPromise) {
    wishlistSchemaCheckPromise = runWishlistSchemaCheck(client).catch((error) => {
      wishlistSchemaCheckPromise = null;
      throw error;
    });
  }

  return wishlistSchemaCheckPromise;
}

export async function assertProfileOnboardingSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!profileOnboardingSchemaCheckPromise) {
    profileOnboardingSchemaCheckPromise = runProfileOnboardingSchemaCheck(
      client,
    ).catch((error) => {
      profileOnboardingSchemaCheckPromise = null;
      throw error;
    });
  }

  return profileOnboardingSchemaCheckPromise;
}

export async function assertCashRefundRequestSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!cashRefundRequestSchemaCheckPromise) {
    cashRefundRequestSchemaCheckPromise = runCashRefundRequestSchemaCheck(
      client,
    ).catch((error) => {
      cashRefundRequestSchemaCheckPromise = null;
      throw error;
    });
  }

  return cashRefundRequestSchemaCheckPromise;
}

export async function assertSignupProfileSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!signupProfileSchemaCheckPromise) {
    signupProfileSchemaCheckPromise = runSignupProfileSchemaCheck(client).catch(
      (error) => {
        signupProfileSchemaCheckPromise = null;
        throw error;
      },
    );
  }

  return signupProfileSchemaCheckPromise;
}

export async function assertAdminPlayerLevelSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!adminPlayerLevelSchemaCheckPromise) {
    adminPlayerLevelSchemaCheckPromise = runAdminPlayerLevelSchemaCheck(
      client,
    ).catch((error) => {
      adminPlayerLevelSchemaCheckPromise = null;
      throw error;
    });
  }

  return adminPlayerLevelSchemaCheckPromise;
}

export async function assertAdminMatchParticipantsSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!adminMatchParticipantsSchemaCheckPromise) {
    adminMatchParticipantsSchemaCheckPromise = runAdminMatchParticipantsSchemaCheck(
      client,
    ).catch((error) => {
      adminMatchParticipantsSchemaCheckPromise = null;
      throw error;
    });
  }

  return adminMatchParticipantsSchemaCheckPromise;
}

export async function assertCouponSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!couponSchemaCheckPromise) {
    couponSchemaCheckPromise = runCouponSchemaCheck(client).catch((error) => {
      couponSchemaCheckPromise = null;
      throw error;
    });
  }

  return couponSchemaCheckPromise;
}

export async function assertAccountWithdrawalSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!accountWithdrawalSchemaCheckPromise) {
    accountWithdrawalSchemaCheckPromise = runAccountWithdrawalSchemaCheck(
      client,
    ).catch((error) => {
      accountWithdrawalSchemaCheckPromise = null;
      throw error;
    });
  }

  return accountWithdrawalSchemaCheckPromise;
}

export async function assertNotificationDispatchSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!notificationDispatchSchemaCheckPromise) {
    notificationDispatchSchemaCheckPromise = runNotificationDispatchSchemaCheck(
      client,
    ).catch((error) => {
      notificationDispatchSchemaCheckPromise = null;
      throw error;
    });
  }

  return notificationDispatchSchemaCheckPromise;
}

export async function assertHomeBannerSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!homeBannerSchemaCheckPromise) {
    homeBannerSchemaCheckPromise = runHomeBannerSchemaCheck(client).catch((error) => {
      homeBannerSchemaCheckPromise = null;
      throw error;
    });
  }

  return homeBannerSchemaCheckPromise;
}

async function runSchemaCheck(supabase: SupabaseServerClient) {
  const matchSnapshotCheck = await supabase
    .from("matches")
    .select("venue_name")
    .limit(1);

  handleSchemaCheckError(matchSnapshotCheck.error);

  const venueDefaultsCheck = await supabase
    .from("venues")
    .select("default_image_urls, default_rules, default_safety_notes")
    .limit(1);

  handleSchemaCheckError(venueDefaultsCheck.error);

  const closeStartedMatchesCheck = await supabase.rpc("close_started_matches");

  handleSchemaCheckError(closeStartedMatchesCheck.error);
}

async function runVenueManagementSchemaCheck(supabase: SupabaseServerClient) {
  await runPublicIdSchemaCheck(supabase);

  const venueWeatherCheck = await supabase
    .from("venues")
    .select("weather_grid_nx, weather_grid_ny")
    .limit(1);

  handleMatchWeatherSchemaError(venueWeatherCheck.error);

  const matchWeatherSnapshotCheck = await supabase
    .from("matches")
    .select("weather_grid_nx, weather_grid_ny")
    .limit(1);

  handleMatchWeatherSchemaError(matchWeatherSnapshotCheck.error);
}

async function runCashSchemaCheck(supabase: SupabaseServerClient) {
  await runPublicIdSchemaCheck(supabase);

  const cashAccountCheck = await supabase
    .from("cash_accounts")
    .select("balance")
    .limit(1);

  handleCashSchemaCheckError(cashAccountCheck.error);

  const cashTransactionCheck = await supabase
    .from("cash_transactions")
    .select("delta_amount")
    .limit(1);

  handleCashSchemaCheckError(cashTransactionCheck.error);

  const matchApplicationCashCheck = await supabase
    .from("match_applications")
    .select("price_snapshot, refunded_amount")
    .limit(1);

  handleCashSchemaCheckError(matchApplicationCashCheck.error);

  const cashChargeOrderCheck = await supabase
    .from("cash_charge_orders")
    .select("order_id")
    .limit(1);

  handleCashSchemaCheckError(cashChargeOrderCheck.error);
}

async function runPublicIdSchemaCheck(supabase: SupabaseServerClient) {
  await runSchemaCheck(supabase);

  const publicIdCheck = await supabase
    .from("matches")
    .select("public_id")
    .limit(1);

  handlePublicIdSchemaError(publicIdCheck.error);
}

async function runChargeOperationsSchemaCheck(supabase: SupabaseServerClient) {
  await runCashSchemaCheck(supabase);

  const chargeOrderOpsCheck = await supabase
    .from("cash_charge_orders")
    .select("last_error_code, refunded_amount, cancel_reason")
    .limit(1);

  handleChargeOperationsSchemaError(chargeOrderOpsCheck.error);

  const chargeOrderEventCheck = await supabase
    .from("cash_charge_order_events")
    .select("provider_event_id")
    .limit(1);

  handleChargeOperationsSchemaError(chargeOrderEventCheck.error);
}

async function runWishlistSchemaCheck(supabase: SupabaseServerClient) {
  await runPublicIdSchemaCheck(supabase);

  const wishlistCheck = await supabase
    .from("match_wishlist_items")
    .select("match_id")
    .limit(1);

  handleWishlistSchemaError(wishlistCheck.error);
}

async function runProfileOnboardingSchemaCheck(supabase: SupabaseServerClient) {
  const profileOnboardingCheck = await supabase
    .from("profiles")
    .select(
      "temporary_level, preferred_weekdays, preferred_time_slots, onboarding_required, onboarding_completed_at, phone_number_e164, phone_verified_at, phone_verification_required",
    )
    .limit(1);

  handleProfileOnboardingSchemaError(profileOnboardingCheck.error);

  const phoneVerificationCheck = await supabase
    .from("phone_verification_requests")
    .select("phone_number_e164")
    .limit(1);

  handlePhoneAuthSchemaError(phoneVerificationCheck.error);
}

async function runCashRefundRequestSchemaCheck(supabase: SupabaseServerClient) {
  await runCashSchemaCheck(supabase);

  const cashRefundRequestCheck = await supabase
    .from("cash_refund_requests")
    .select("requested_amount, bank_name, hold_transaction_id, status")
    .limit(1);

  handleCashRefundRequestSchemaError(cashRefundRequestCheck.error);

  const refundCancellationCheck = await supabase
    .from("cash_refund_request_cancellations")
    .select("refund_request_id, charge_order_id, cancel_amount, status")
    .limit(1);

  handleCashRefundRequestSchemaError(refundCancellationCheck.error);
}

async function runSignupProfileSchemaCheck(supabase: SupabaseServerClient) {
  await runProfileOnboardingSchemaCheck(supabase);

  const signupProfileCheck = await supabase
    .from("profiles")
    .select(
      "legal_name, birth_date, gender, signup_profile_required, signup_profile_completed_at",
    )
    .limit(1);

  handleSignupProfileSchemaError(signupProfileCheck.error);

  const signupConsentCheck = await supabase
    .from("profile_consents")
    .select("consent_type")
    .limit(1);

  handleSignupProfileSchemaError(signupConsentCheck.error);
}

async function runAdminPlayerLevelSchemaCheck(supabase: SupabaseServerClient) {
  await runSignupProfileSchemaCheck(supabase);

  const playerLevelCheck = await supabase
    .from("profiles")
    .select("player_level")
    .limit(1);

  handleAdminPlayerLevelSchemaError(playerLevelCheck.error);
}

async function runAdminMatchParticipantsSchemaCheck(
  supabase: SupabaseServerClient,
) {
  await runAdminPlayerLevelSchemaCheck(supabase);

  const participantRpcCheck = await ((supabase.rpc(
    "list_admin_match_participants",
    {
      p_match_ids: [],
    },
  ) as any) as { error: { code?: string; message?: string } | null });

  handleAdminMatchParticipantsSchemaError(participantRpcCheck.error);

  const refundExceptionModeCheck = await supabase
    .from("matches")
    .select("refund_exception_mode")
    .limit(1);

  handleRefundPolicyRuntimeSchemaError(refundExceptionModeCheck.error);
}

async function runCouponSchemaCheck(supabase: SupabaseServerClient) {
  await runCashSchemaCheck(supabase);

  const couponTemplateCheck = await supabase
    .from("coupon_templates")
    .select("discount_amount, auto_issue_on_signup, is_active")
    .limit(1);

  handleCouponSchemaCheckError(couponTemplateCheck.error);

  const userCouponCheck = await supabase
    .from("user_coupons")
    .select("discount_amount_snapshot, issued_reason, used_match_application_id, restore_count")
    .limit(1);

  handleCouponSchemaCheckError(userCouponCheck.error);

  const matchApplicationCouponCheck = await supabase
    .from("match_applications")
    .select("coupon_id, coupon_discount_amount, charged_amount_snapshot")
    .limit(1);

  handleCouponSchemaCheckError(matchApplicationCouponCheck.error);

  const refundExceptionModeCheck = await supabase
    .from("matches")
    .select("refund_exception_mode")
    .limit(1);

  handleRefundPolicyRuntimeSchemaError(refundExceptionModeCheck.error);

  const applyToMatchCheck = await ((supabase.rpc(
    "apply_to_match",
    {
      p_coupon_id: null,
      p_match_id: "00000000-0000-0000-0000-000000000000",
    },
  ) as any) as { error: { code?: string; message?: string } | null });

  if (!isExpectedCouponRpcProbeError(applyToMatchCheck.error)) {
    handleCouponSchemaCheckError(applyToMatchCheck.error);
  }

  const cancelByAdminCheck = await ((supabase.rpc(
    "cancel_match_application_by_admin",
    {
      p_application_id: "00000000-0000-0000-0000-000000000000",
      p_reason: "admin_cancelled",
    },
  ) as any) as { error: { code?: string; message?: string } | null });

  if (!isExpectedAdminCancellationRpcProbeError(cancelByAdminCheck.error)) {
    handleRefundPolicyRuntimeSchemaError(cancelByAdminCheck.error);
  }
}

async function runNotificationDispatchSchemaCheck(supabase: SupabaseServerClient) {
  await runChargeOperationsSchemaCheck(supabase);
  await runProfileOnboardingSchemaCheck(supabase);

  const notificationDispatchCheck = await supabase
    .from("notification_dispatches")
    .select("dedupe_key, provider_group_id, scheduled_for")
    .limit(1);

  handleNotificationDispatchSchemaError(notificationDispatchCheck.error);

  const matchWeatherStateCheck = await supabase
    .from("match_weather_states")
    .select("match_id, rain_alert_sent_at, last_precipitation_mm")
    .limit(1);

  handleNotificationDispatchSchemaError(matchWeatherStateCheck.error);
}

async function runAccountWithdrawalSchemaCheck(supabase: SupabaseServerClient) {
  await runCouponSchemaCheck(supabase);

  const profileWithdrawalCheck = await supabase
    .from("profiles")
    .select("account_status, withdrawal_requested_at, withdrawn_at")
    .limit(1);

  handleAccountWithdrawalSchemaCheckError(profileWithdrawalCheck.error);

  const withdrawalRequestCheck = await supabase
    .from("account_withdrawal_requests")
    .select("refund_request_id, requested_at, status")
    .limit(1);

  handleAccountWithdrawalSchemaCheckError(withdrawalRequestCheck.error);

  const withdrawalRejoinBlockCheck = await supabase
    .from("withdrawal_rejoin_blocks")
    .select("phone_number_e164, blocked_until")
    .limit(1);

  handleAccountWithdrawalSchemaCheckError(withdrawalRejoinBlockCheck.error);
}

async function runHomeBannerSchemaCheck(supabase: SupabaseServerClient) {
  const homeBannerCheck = await ((supabase.from("home_banners" as any) as any)
    .select("title, image_url, href, display_order, is_active, starts_at, ends_at")
    .limit(1));

  handleHomeBannerSchemaCheckError(homeBannerCheck.error);
}

function handleSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the function")
  ) {
    throw new Error(REQUIRED_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify database schema: ${error.message}`);
}

function handleCashSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_CASH_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify cash foundation schema: ${error.message}`);
}

function handleProfileOnboardingSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_PROFILE_ONBOARDING_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify profile onboarding schema: ${error.message}`);
}

function handlePhoneAuthSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_PHONE_AUTH_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify phone auth schema: ${error.message}`);
}

function handlePublicIdSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_PUBLIC_ID_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify public match routing schema: ${error.message}`);
}

function handleCashRefundRequestSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_CASH_REFUND_REQUEST_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify cash refund request schema: ${error.message}`);
}

function handleSignupProfileSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_SIGNUP_PROFILE_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify signup profile schema: ${error.message}`);
}

function handleAdminPlayerLevelSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_ADMIN_PLAYER_LEVEL_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify admin player level schema: ${error.message}`);
}

function handleAdminMatchParticipantsSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the function") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_ADMIN_MATCH_PARTICIPANTS_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify admin participant schema: ${error.message}`);
}

function handleCouponSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation") ||
    error.message?.includes("Could not find the function")
  ) {
    throw new Error(REQUIRED_COUPON_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify coupon schema: ${error.message}`);
}

function handleAccountWithdrawalSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation") ||
    error.message?.includes("Could not find the function")
  ) {
    throw new Error(REQUIRED_ACCOUNT_WITHDRAWAL_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify account withdrawal schema: ${error.message}`);
}

function handleRefundPolicyRuntimeSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation") ||
    error.message?.includes("Could not find the function")
  ) {
    throw new Error(REQUIRED_REFUND_POLICY_RUNTIME_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify refund exception schema: ${error.message}`);
}

function handleNotificationDispatchSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_NOTIFICATION_DISPATCH_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify notification schema: ${error.message}`);
}

function handleMatchWeatherSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_MATCH_WEATHER_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify match weather schema: ${error.message}`);
}

function handleHomeBannerSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_HOME_BANNER_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify home banner schema: ${error.message}`);
}

function isExpectedCouponRpcProbeError(
  error: { code?: string; message?: string } | null,
) {
  if (!error?.message) {
    return false;
  }

  const normalized = error.message.toUpperCase();

  return normalized.includes("AUTH_REQUIRED") || normalized.includes("MATCH_NOT_FOUND");
}

function isExpectedAdminCancellationRpcProbeError(
  error: { code?: string; message?: string } | null,
) {
  if (!error?.message) {
    return false;
  }

  const normalized = error.message.toUpperCase();

  return (
    normalized.includes("ADMIN_REQUIRED") ||
    normalized.includes("APPLICATION_NOT_FOUND")
  );
}

function handleChargeOperationsSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_CHARGE_OPERATIONS_MESSAGE);
  }

  throw new Error(`Failed to verify Toss charge schema: ${error.message}`);
}

function handleWishlistSchemaError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (
    error.code === "42703" ||
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.message?.includes("does not exist") ||
    error.message?.includes("Could not find the table") ||
    error.message?.includes("Could not find the relation")
  ) {
    throw new Error(REQUIRED_WISHLIST_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify match wishlist schema: ${error.message}`);
}
