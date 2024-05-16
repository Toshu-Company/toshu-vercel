import HitomiAPI from "@/libs/hitomi";
import { isHitomiLanguage } from "@/libs/hitomi/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
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
      return await HitomiAPI.getSearch(query, language).then(NextResponse.json);

    return await HitomiAPI.getSearch(query, language)
      .then((res) => res.slice((page - 1) * 25, page * 25))
      .then(NextResponse.json);
  } else {
    if (!page)
      return await HitomiAPI.getIndex(language).then(NextResponse.json);

    return await HitomiAPI.getIndexWithPage(language, page).then(
      NextResponse.json
    );
  }
}
