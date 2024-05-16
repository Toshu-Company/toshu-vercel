import HitomiAPI from "@/libs/hitomi";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  const [hash, ext] = params.file.split(".");

  if (!hash || !ext)
    return NextResponse.json({ error: "Invalid file name" }, { status: 400 });

  if (!["webp", "avif"].includes(ext))
    return NextResponse.json(
      { error: "Invalid file extension" },
      { status: 400 }
    );

  const image = await HitomiAPI.getPreview(
    hash,
    {
      webp: "webpbigtn",
      avif: "avifbigtn",
    }[ext as "webp" | "avif"] as "webpbigtn" | "avifbigtn"
  );
  return new NextResponse(image, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": `image/${ext}`,
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
