import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

enum VideoType {
  LIVE_DL = 0,
  DL_LIST = 1,
}

interface Video {
  video?: string;
  thumbnail?: string;
  twitter?: string;
}

export async function GET(request: NextRequest) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);
  const offset = Number(params.get("offset")) || 0;
  const limit = Number(params.get("limit")) || 45;
  const type: VideoType = Number(params.get("type")) || VideoType.LIVE_DL;
  const order: "24" | "72" | "168" | "post_date" =
    (params.get("order") as any) || "post_date";

  const form = new FormData();
  form.append("offset", offset.toString());
  form.append("limit", limit.toString());
  form.append("tag", "null");
  form.append("type", type.toString());
  form.append("order", order);
  form.append("le", "1000");
  form.append("ty", "p4");

  const res = await fetch("https://twivideo.net/templates/view_lists.php", {
    method: "POST",
    body: form,
    cache: "no-store",
  })
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(($) => {
      const videos: Video[] = [];
      $("div.item_inner").each((i, el) => {
        const $el = $(el);
        const video = {
          video: $el.find(".item_image a").attr("href"),
          thumbnail: $el.find(".item_image img").attr("src"),
          twitter: $el.find(".tw_icon a").attr("href"),
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
}
