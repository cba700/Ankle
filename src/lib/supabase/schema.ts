import "server-only";

import { getSupabaseServerClient } from "./server";

type SupabaseServerClient = NonNullable<
  Awaited<ReturnType<typeof getSupabaseServerClient>>
>;

const REQUIRED_MIGRATION =
  "20260403183000_add_venue_defaults_and_match_snapshots.sql";

const REQUIRED_MIGRATION_MESSAGE = `Database schema is outdated. Apply migration ${REQUIRED_MIGRATION} before running venue management features.`;

let schemaCheckPromise: Promise<void> | null = null;

export async function assertVenueManagementSchemaReady(
  supabase?: SupabaseServerClient | null,
) {
  const client = supabase ?? (await getSupabaseServerClient());

  if (!client) {
    return;
  }

  if (!schemaCheckPromise) {
    schemaCheckPromise = runSchemaCheck(client).catch((error) => {
      schemaCheckPromise = null;
      throw error;
    });
  }

  return schemaCheckPromise;
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
}

function handleSchemaCheckError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return;
  }

  if (error.code === "42703" || error.message?.includes("does not exist")) {
    throw new Error(REQUIRED_MIGRATION_MESSAGE);
  }

  throw new Error(`Failed to verify database schema: ${error.message}`);
}
