import * as cheerio from "cheerio";

export interface Video {
  id?: string;
  url?: string;
  user?: string;
  content?: string;
  thumbnail?: string;
}

export function parseItems($: cheerio.CheerioAPI): Video[] {
  const videos: Video[] = [];

  $("div.listn").each((i, el) => {
    const $el = $(el);
    const video: Video = {
      id: $el.attr("id"),
      url: $el.find("a").attr("href"),
      user: $el.find("div.user a").attr("title"),
      content: $el.find("img").attr("alt"),
      thumbnail: $el.find("img").attr("src"),
    };
    videos.push(video);
  });

  return videos;
}
