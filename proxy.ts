import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/mypage/:path*",
    "/match/[^/]+/apply",
    "/api/matches/[^/]+/applications",
    "/api/matches/[^/]+/applications/me",
  ],
};
