export const runtime = "edge";

export async function POST(request: Request) {
  const body = await request.json();

  const { url } = body;
  const res = await fetch(url, {
    headers: {
      Referer: "https://twivideo.net/",
    },
  }).then((res) => res.text());

  return new Response(res, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
