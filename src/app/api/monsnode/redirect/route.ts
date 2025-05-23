import * as cheerio from "cheerio";
export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json();
  const { url } = body;

  // fetch에서 redirect를 따라가지 않도록 설정
  const response = await fetch(url, {
    headers: {
      Referer: "https://twivideo.net/",
    },
    redirect: "manual",
  });

  // Location 헤더에서 최종 redirect URL 추출
  const location = response.headers.get("location");

  return new Response(location ?? "", {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
