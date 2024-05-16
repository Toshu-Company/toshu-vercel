import HitomiAPI from "@/libs/hitomi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      statusText: "OK",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const [hash, ext] = params.file.split(".");

  if (!hash || !ext)
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });

  if (!["webp", "avif"].includes(ext))
    return NextResponse.json(
      { error: "Invalid file extension" },
      { status: 400 }
    );

  const image = await HitomiAPI.getImage(hash, ext as "webp" | "avif");
  return new NextResponse(image, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": `image/${ext}`,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
