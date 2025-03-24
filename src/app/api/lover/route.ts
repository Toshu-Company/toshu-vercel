import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

enum VideoType {
  LIVE_DL = 0,
  DL_LIST = 1,
}

interface Video {
  id: string;
  title: string;
}

export async function GET(request: NextRequest) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);
  const page = Number(params.get("page")) || 1;

  const query = new URLSearchParams();
  query.append("page", page.toString());

  console.log(`https://lover937.net/index.php?${query}`);

  const res = await fetch(`https://lover937.net/index.php?${query}`, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ko-KR,ko;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "upgrade-insecure-requests": "1",
    },
    referrer: "https://lover937.net/error.html",
    referrerPolicy: "strict-origin-when-cross-origin",
    method: "GET",
    mode: "cors",
    credentials: "include",
    cache: "no-store",
  })
    .then((res) => res.text())
    // .then((res) => (console.log(res), res))
    .then((res) => cheerio.load(res))
    .then(($) => {
      const videos: Video[] = [];
      $("tr:not(.notice) .title a").each((i, el) => {
        const $el = $(el);
        const video = {
          id: $el.attr("href")?.match(/document_srl=(\d+)/)?.[1],
          title: $el
            .text()
            .replace(/\[.*\]/, "")
            .trim(),
        };
        console.log(video);
        if (video.id) {
          videos.push(video as Video);
        }
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
