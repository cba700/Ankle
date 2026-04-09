import "server-only";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

const VENUE_MEDIA_BUCKET = "media-public";
const VENUE_MEDIA_PREFIX = "venues";
const STORAGE_PUBLIC_SEGMENT = `/storage/v1/object/public/${VENUE_MEDIA_BUCKET}/`;

type StorageClient = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options?: {
          cacheControl?: string;
          contentType?: string;
          upsert?: boolean;
        },
      ) => Promise<{ error: { message: string } | null }>;
      remove: (paths: string[]) => Promise<{ error: { message: string } | null }>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
};

export async function uploadVenueImageFiles(
  client: StorageClient,
  {
    files,
    venueId,
  }: {
    files: File[];
    venueId: string;
  },
) {
  const uploadedUrls = new Map<string, string>();

  try {
    for (const file of files) {
      if (file.type !== "image/webp") {
        throw new Error("Uploaded venue images must be WEBP files");
      }

      const path = buildVenueImagePath(venueId, file.name);
      const bucket = client.storage.from(VENUE_MEDIA_BUCKET);
      const { error } = await bucket.upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      uploadedUrls.set(file.name, bucket.getPublicUrl(path).data.publicUrl);
    }
  } catch (error) {
    await deleteVenueImageUrls(client, Array.from(uploadedUrls.values()));
    throw error;
  }

  return uploadedUrls;
}

export async function deleteVenueImageUrls(client: StorageClient, urls: string[]) {
  const storagePaths = urls
    .map(extractVenueImageStoragePath)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await client.storage.from(VENUE_MEDIA_BUCKET).remove(storagePaths);

  if (error) {
    throw new Error(error.message);
  }
}

export function isManagedVenueImageUrl(url: string) {
  return extractVenueImageStoragePath(url) !== null;
}

function buildVenueImagePath(venueId: string, fileName: string) {
  return `${VENUE_MEDIA_PREFIX}/${venueId}/${sanitizeFileName(fileName)}`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractVenueImageStoragePath(url: string) {
  const publicEnv = getSupabasePublicEnv();

  if (!publicEnv || !url.startsWith(`${publicEnv.supabaseUrl}${STORAGE_PUBLIC_SEGMENT}`)) {
    return null;
  }

  const rawPath = url.slice(`${publicEnv.supabaseUrl}${STORAGE_PUBLIC_SEGMENT}`.length);

  if (!rawPath.startsWith(`${VENUE_MEDIA_PREFIX}/`)) {
    return null;
  }

  return decodeURIComponent(rawPath);
}
