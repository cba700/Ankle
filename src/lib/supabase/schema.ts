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

const REQUIRED_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_MIGRATION} before running venue and match features.`;
const REQUIRED_PUBLIC_ID_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_PUBLIC_ID_MIGRATION} before running public match routes.`;
const REQUIRED_CASH_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_CASH_MIGRATION} before running cash-backed application features.`;
const REQUIRED_CHARGE_OPERATIONS_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_CHARGE_OPERATIONS_MIGRATION} before running Toss charge features.`;

let schemaCheckPromise: Promise<void> | null = null;
let publicIdSchemaCheckPromise: Promise<void> | null = null;
let cashSchemaCheckPromise: Promise<void> | null = null;
let chargeOperationsCheckPromise: Promise<void> | null = null;

export async function assertVenueManagementSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!schemaCheckPromise) {
    schemaCheckPromise = runPublicIdSchemaCheck(client).catch((error) => {
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
