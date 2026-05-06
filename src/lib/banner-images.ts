import "server-only";

import { getSupabasePublicEnv } from "@/lib/supabase/env";

const HOME_BANNER_MEDIA_BUCKET = "media-public";
const HOME_BANNER_MEDIA_PREFIX = "banners";
const STORAGE_PUBLIC_SEGMENT = `/storage/v1/object/public/${HOME_BANNER_MEDIA_BUCKET}/`;

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

export async function uploadHomeBannerImageFile(
  client: StorageClient,
  {
    bannerId,
    file,
  }: {
    bannerId: string;
    file: File;
  },
) {
  if (file.type !== "image/webp") {
    throw new Error("Uploaded banner images must be WEBP files");
  }

  const path = buildHomeBannerImagePath(bannerId, file.name);
  const bucket = client.storage.from(HOME_BANNER_MEDIA_BUCKET);
  const { error } = await bucket.upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return bucket.getPublicUrl(path).data.publicUrl;
}

export async function deleteHomeBannerImageUrls(client: StorageClient, urls: string[]) {
  const storagePaths = urls
    .map(extractHomeBannerImageStoragePath)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await client.storage.from(HOME_BANNER_MEDIA_BUCKET).remove(storagePaths);

  if (error) {
    throw new Error(error.message);
  }
}

export function isManagedHomeBannerImageUrl(url: string) {
  return extractHomeBannerImageStoragePath(url) !== null;
}

function buildHomeBannerImagePath(bannerId: string, fileName: string) {
  return `${HOME_BANNER_MEDIA_PREFIX}/${bannerId}/${sanitizeFileName(fileName)}`;
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractHomeBannerImageStoragePath(url: string) {
  const publicEnv = getSupabasePublicEnv();

  if (!publicEnv || !url.startsWith(`${publicEnv.supabaseUrl}${STORAGE_PUBLIC_SEGMENT}`)) {
    return null;
  }

  const rawPath = url.slice(`${publicEnv.supabaseUrl}${STORAGE_PUBLIC_SEGMENT}`.length);

  if (!rawPath.startsWith(`${HOME_BANNER_MEDIA_PREFIX}/`)) {
    return null;
  }

  return decodeURIComponent(rawPath);
}
