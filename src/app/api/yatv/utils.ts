import * as cheerio from "cheerio";

export const HOST = "https://yatv1.com";
export const CDN = "https://hellocdn4.net";

export interface Result {
  thumbnail: string | undefined;
  title: string;
  upload_date: string;
  playtime: string;
  url: string;
}

export function parseSearchResult($: cheerio.CheerioAPI): Result[] {
  const videos: Result[] = [];
  $("article.post").each((i, el) => {
    const $el = $(el);
    const thumbnail = $el.find("img").attr("src");
    const title = $el.find("h3").text().trim();
    const upload_date = $el.find("div.up").text().trim();
    const playtime = $el.find("div.pt").text().trim();
    const url = $el.find("a").attr("href");

    if (!url) return;

    videos.push({
      thumbnail,
      title,
      upload_date,
      playtime,
      url,
    });
  });
  return videos;
}
