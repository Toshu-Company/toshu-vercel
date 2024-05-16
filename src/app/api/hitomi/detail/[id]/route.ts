import HitomiAPI from "@/libs/hitomi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  return NextResponse.json(await HitomiAPI.getGallery(id), {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "CDN-Cache-Control": "public, s-maxage=3600",
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
    },
  });
}
