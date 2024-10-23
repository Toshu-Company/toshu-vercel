import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { CDN, HOST } from "../utils";
import Sandbox from "@nyariv/sandboxjs";

export const runtime = "edge";

const sandbox = new Sandbox();

export async function POST(request: NextRequest) {
  const { url }: { url: string } = await request.json();

  const url_data = await fetch(`${HOST}${url}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      Referer: HOST,
    },
    method: "GET",
    cache: "no-store",
  })
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(($) => $("iframe#movie").attr("src"))
    .then((url) =>
      url
        ? {
            url: url,
            thumbnail: new URL(url).searchParams.get("img"),
          }
        : undefined
    )
    .catch(console.error);

  if (!url_data) {
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }

  const res = await fetch(url_data.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
      Referer: HOST,
    },
    method: "GET",
    cache: "no-store",
  })
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(($) => $("script:not([src])").text())
    .then((script) =>
      sandbox
        .compile(`return ${script}`)({
          play: (a: any, b: any, c: any) => c,
        })
        .run()
    );

  return NextResponse.json(
    {
      video: res,
      thumbnail: url_data.thumbnail,
      message: `Referer header must be set to "${CDN}".`,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60",
        "CDN-Cache-Control": "public, s-maxage=600",
        "Vercel-CDN-Cache-Control": "public, s-maxage=600",
      },
    }
  );
}
