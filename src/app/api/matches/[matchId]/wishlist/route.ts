import { NextResponse } from "next/server";
import { assertMatchWishlistSchemaReady } from "@/lib/supabase/schema";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
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

  const { error } = await supabase
    .from("match_wishlist_items")
    .insert({
      match_id: matchId,
      user_id: user.id,
    });

  if (error && error.code !== "23505") {
    return NextResponse.json(
      { code: getWishlistErrorCode(error.code) },
      { status: getWishlistErrorStatus(error.code) },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
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

  const { error } = await supabase
    .from("match_wishlist_items")
    .delete()
    .eq("match_id", matchId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { code: getWishlistErrorCode(error.code) },
      { status: getWishlistErrorStatus(error.code) },
    );
  }

  return NextResponse.json({ ok: true });
}

function getWishlistErrorCode(code?: string) {
  if (code === "23503") {
    return "MATCH_NOT_FOUND";
  }

  if (code === "22P02") {
    return "INVALID_MATCH_ID";
  }

  return "UNKNOWN_ERROR";
}

function getWishlistErrorStatus(code?: string) {
  if (code === "23503") {
    return 404;
  }

  if (code === "22P02") {
    return 400;
  }

  return 500;
}
