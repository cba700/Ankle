import { NextResponse } from "next/server";
import { assertMatchWishlistSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { listWishlistMatchIdsByUserId } from "@/lib/wishlist";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { code: "SUPABASE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  await assertMatchWishlistSchemaReady(supabase);

  const matchIds = await listWishlistMatchIdsByUserId(user.id, supabase);

  return NextResponse.json({
    matchIds,
    ok: true,
  });
}
