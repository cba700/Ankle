import type { NextConfig } from "next";

const supabaseStorageRemotePatterns = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return [];
  }

  try {
    const url = new URL(supabaseUrl);

    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.219.100"],
  experimental: {
    serverActions: {
      bodySizeLimit: "24mb",
    },
  },
  images: {
    remotePatterns: supabaseStorageRemotePatterns,
  },
};

export default nextConfig;
