import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface Video {
  id?: string;
  url?: string;
  user?: string;
  content?: string;
  thumbnail?: string;
}

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
      .then(($) => {
        const videos: Video[] = [];
        $("div.listn").each((i, el) => {
          const $el = $(el);
          const video: Video = {
            id: $el.attr("id"),
            url: $el.find("a").attr("href"),
            user: $el.find("div.user a").attr("title"),
            content: $el.find("img").attr("alt"),
            thumbnail: $el.find("img").attr("src"),
          };
          videos.push(video);
        });
        return videos;
      });

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
