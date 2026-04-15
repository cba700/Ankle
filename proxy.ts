import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/cash/charge/:path*",
    "/mypage/:path*",
    "/match/[^/]+/apply",
    "/signup/complete",
    "/verify-phone",
    "/welcome",
    "/api/auth/signup-completion",
    "/api/cash/charge-orders",
    "/api/cash/refund-requests",
    "/api/matches/[^/]+/applications",
    "/api/matches/[^/]+/applications/me",
    "/api/payments/toss/confirm",
    "/api/payments/toss/fail",
  ],
};
