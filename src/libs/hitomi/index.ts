import { HitomiLanguage } from "./types";
import { getGG } from "./unsafe";

export default class HitomiAPI {
  public static async getIndex(language: HitomiLanguage = "all") {
    const res = await fetch(`https://ltn.hitomi.la/index-${language}.nozomi`)
      .then((x) => x.arrayBuffer())
      .then(this.parseIntArray);

    return res;
  }

  public static async getIndexWithRange(
    language: HitomiLanguage = "all",
    start = 0,
    end = 25
  ) {
    const res = await fetch(`https://ltn.hitomi.la/index-${language}.nozomi`, {
      headers: {
        Range: `bytes=${start * 4}-${end * 4 - 1}`,
      },
    })
      .then((x) => x.arrayBuffer())
      .then(this.parseIntArray);

    return res;
  }

  public static async getIndexWithPage(
    language: HitomiLanguage = "all",
    page = 1,
    size = 25
  ) {
    return await this.getIndexWithRange(
      language,
      (page - 1) * size,
      page * size
    );
  }

  public static async getGallery(id: number) {
    const res = await fetch(`https://ltn.hitomi.la/galleries/${id}.js`, {
      next: {
        revalidate: 60 * 60 * 24,
      },
    })
      .then((x) => x.text())
      .then((x) => x.substring("var galleryinfo = ".length))
      .then(JSON.parse);

    return res;
  }

  public static async getImage(hash: string, type: "avif" | "webp") {
    const gg = await this.getGG();
    const path = `${type}/${gg.b}${gg.s(hash)}/${hash}.${type}`;
    const subdomain =
      String.fromCharCode(
        97 +
          gg.m(
            parseInt(
              /(..)(.)$/
                .exec(hash)!
                .splice(1)
                .reverse()
                .reduce((a, b) => a + b, ""),
              16
            )
          )
      ) + "a";
    return await fetch(`https://${subdomain}.hitomi.la/${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://hitomi.la/",
      },
    }).then((x) => x.arrayBuffer());
  }

  private static parseIntArray(buffer: ArrayBuffer) {
    const view = new DataView(buffer);

    const result: number[] = [];
    for (let i = 0; i < view.byteLength; i += 4) {
      result.push(view.getInt32(i, false));
    }
    return result;
  }

  public static async getGG() {
    return getGG();
  }
}
