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
      "Cache-Control": "public, max-age=86400, immutable",
      "CDN-Cache-Control": "public, s-maxage=31536000",
      "Vercel-CDN-Cache-Control": "public, s-maxage=31536000",
    },
  });
}
