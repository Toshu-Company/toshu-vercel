import { CDN } from "../utils";

export const runtime = "edge";

export async function GET(request: Request) {
  const rawParams = request.url.split("?")[1];
  const params = new URLSearchParams(rawParams);
  if (!params.has("url")) {
    return new Response("Missing URL parameter", {
      status: 400,
      statusText: "Bad Request",
    });
  }

  const url = atob(params.get("url")!);
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
