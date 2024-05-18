import HitomiAPI from "@/libs/hitomi";
import { isHitomiLanguage } from "@/libs/hitomi/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);

  const query = params.get("query");

  if (!query) {
    return NextResponse.json("Query is required", { status: 400 });
  }

  return HitomiAPI.getSuggestion(query).then(NextResponse.json);
}
