import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { CDN, HOST, parsePost } from "../utils";
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
    .then((res) => [cheerio.load(res), res] as const)
    .then(([$, text]) => {
      const url = $("iframe#movie").attr("src");
      const id = /cvid='([a-z0-9]+)'/.exec(text)?.[1];
      const tags = $("body > div > a:not([class])")
        .map((i, el) => $(el).text())
        .toArray();
      const content = parsePost($(`article.post#${id}`));
      if (!url) return undefined;

      console.log(tags);

      return {
        url: url,
        id: content?.id,
        tags: tags,
        title: content?.title,
        upload_date: content?.upload_date,
        playtime: content?.playtime,
        thumbnail: new URL(url).searchParams.get("img"),
      };
    })
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
    .then(
      (script) =>
        sandbox
          .compile(`return ${script}`)({
            play: (a: any, b: any, c: any) => c,
          })
          .run() as string
    );

  return NextResponse.json(
    {
      video: res,
      id: url_data.id,
      tags: url_data.tags,
      title: url_data.title,
      playtime: url_data.playtime,
      thumbnail: url_data.thumbnail,
      upload_date: url_data.upload_date,
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
