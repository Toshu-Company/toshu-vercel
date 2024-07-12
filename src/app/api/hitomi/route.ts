import HitomiAPI from "@/libs/hitomi";
import { isHitomiLanguage } from "@/libs/hitomi/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

function JsonResponse<JsonBody = unknown>(body: JsonBody) {
  return NextResponse.json(body, {
    status: 200,
    statusText: "OK",
    headers: {
      "Cache-Control": "public, max-age=300",
      "CDN-Cache-Control": "public, s-maxage=300",
      "Vercel-CDN-Cache-Control": "public, s-maxage=300",
      "Generated-Date": HitomiAPI.date.toUTCString(),
    },
  });
}

export async function GET(request: NextRequest) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);

  const query = params.get("query");
  const page = Number(params.get("page"));
  const language = params.get("language") || "all";

  if (page && page < 1)
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });

  if (language !== "all" && !isHitomiLanguage(language))
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });

  if (query) {
    if (!page)
      return await HitomiAPI.getSearch(query, language).then(JsonResponse);

    return await HitomiAPI.getSearch(query, language)
      .then((res) => res.slice((page - 1) * 25, page * 25))
      .then(JsonResponse);
  } else {
    if (!page) return await HitomiAPI.getIndex(language).then(JsonResponse);

    return await HitomiAPI.getIndexWithPage(language, page).then(JsonResponse);
  }
}
