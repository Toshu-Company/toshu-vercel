import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { parseItems } from "./parser";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const rawParams = request.url.split("?")[1];
    const params = new URLSearchParams(rawParams);
    const page = Number(params.get("page")) || 0;

    const url = new URL("https://monsnode.com/");
    url.searchParams.set("page", page.toString());

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => res.text())
      .then((res) => cheerio.load(res))
      .then(parseItems);

    return NextResponse.json(res, {
      headers: {
        "Cache-Control": "public, max-age=60",
        "CDN-Cache-Control": "public, s-maxage=600",
        "Vercel-CDN-Cache-Control": "public, s-maxage=600",
      },
    });
  } catch (error) {
    console.error("Error fetching Twivideo data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
