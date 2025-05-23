import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { parseItems } from "../parser";
import { NextApiRequest } from "next";

export const runtime = "edge";

export async function GET(
  request: NextApiRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const data = await fetch(`https://monsnode.com/v${id}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    },
    method: "GET",
    cache: "no-store",
  })
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(($) => {
      const ct = $("div.container");

      const video = {
        id,
        content: ct.find("div.sub").text().trim(),
        thumbnail: ct.find("img").attr("src"),
        url: new URL(ct.find("a").attr("href")!, "https://monsnode.com").href,
        user: $("div.user").first().text().trim(),
        related: parseItems($),
      };

      return video;
    });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=60",
      "CDN-Cache-Control": "public, s-maxage=600",
      "Vercel-CDN-Cache-Control": "public, s-maxage=600",
    },
  });
}

export async function POST(request: NextRequest) {
  const { url }: { url: string } = await request.json();

  return await Parse(url);
}
