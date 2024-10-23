import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { HOST, parseSearchResult } from "./utils";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);
  const page = Number(params.get("page")) || 1;

  const query = new URLSearchParams();
  query.append("page", page.toString());

  const res = await fetch(
    `${HOST}/%ED%95%9C%EA%B5%AD%EC%95%BC%EB%8F%99/%EC%95%BC%EB%8F%99%EB%AA%A9%EB%A1%9D-${page}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      },
      referrer: HOST,
      method: "GET",
      cache: "no-store",
    }
  )
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(parseSearchResult)
    .catch(console.error);

  return NextResponse.json(res, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "CDN-Cache-Control": "public, s-maxage=600",
      "Vercel-CDN-Cache-Control": "public, s-maxage=600",
    },
  });
}
