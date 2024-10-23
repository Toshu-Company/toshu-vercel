import { CDN } from "../utils";

export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json();

  const { url } = body;
  const res = await fetch(url, {
    headers: {
      Referer: CDN,
    },
  });

  const blob = await res.blob();

  return new Response(blob, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "video/mp4",
    },
  });
}
