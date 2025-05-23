import * as cheerio from "cheerio";
export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json();

  const { url } = body;
  const res = await fetch(url, {
    headers: {
      Referer: "https://twivideo.net/",
    },
  })
    .then((res) => res.text())
    .then((res) => cheerio.load(res))
    .then(($) => $("a").attr("href"));

  return new Response(res, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
