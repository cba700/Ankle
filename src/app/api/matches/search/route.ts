import { NextResponse } from "next/server";
import { buildPublicMatchSearchItems } from "@/lib/match-search";
import { getPublicMatches } from "@/lib/matches-data";

export async function GET() {
  const matches = await getPublicMatches();
  const items = buildPublicMatchSearchItems(matches);

  return NextResponse.json({ items });
}
