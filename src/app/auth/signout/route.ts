import { NextResponse } from "next/server";
import { clearSingleSessionCookie } from "@/lib/auth/single-session";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/http";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await getSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/", requestUrl.origin), {
    headers: PRIVATE_NO_STORE_HEADERS,
    status: 303,
  });

  clearSingleSessionCookie(response);
  return response;
}
