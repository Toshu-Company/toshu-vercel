import { kv } from "@vercel/kv";
import { BData, BNode, HitomiLanguage, IndexOfField } from "./types";
import { parseGG } from "./unsafe";
import { domain, compressed_nozomi_prefix, B, max_node_size } from "./const";

export default class HitomiAPI {
  private static cache = kv;
  public static date: Date;

  public static async getIndex(language: HitomiLanguage = "all") {
    const res = await fetch(`https://ltn.${domain}/index-${language}.nozomi`, {
      next: {
        revalidate: 600,
      },
    })
      .then(
        (x) => ((this.date = new Date(x.headers.get("Date") ?? this.date)), x)
      )
      .then((x) => x.arrayBuffer())
      .then(this.parseIntArray);

    return res;
  }

  public static async getIndexWithRange(
    language: HitomiLanguage = "all",
    start = 0,
    end = 25
  ) {
    const res = await fetch(`https://ltn.${domain}/index-${language}.nozomi`, {
      headers: {
        Range: `bytes=${start * 4}-${end * 4 - 1}`,
      },
      next: {
        revalidate: 600,
      },
    })
      .then(
        (x) => ((this.date = new Date(x.headers.get("Date") ?? this.date)), x)
      )
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
    const res = await fetch(`https://ltn.${domain}/galleries/${id}.js`)
      .then((x) => x.text())
      .then((x) => x.substring("var galleryinfo = ".length))
      .then(JSON.parse);

    return res;
  }

  public static async getImage(hash: string, type: "avif" | "webp") {
    const gg = await this.getGG();
    const path = `${gg.b}${gg.s(hash)}/${hash}.${type}`;
    const subdomain =
      (type == "avif" ? "a" : "w") +
      String(
        gg.m(
          parseInt(
            /(..)(.)$/
              .exec(hash)!
              .splice(1)
              .reverse()
              .reduce((a, b) => a + b, ""),
            16
          )
        ) + 1
      );
    return await fetch(`https://${subdomain}.${domain}/${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://hitomi.la/",
      },
    }).then((x) => x.arrayBuffer());
  }

  public static async getPreview(
    hash: string,
    type: "avifbigtn" | "avifsmallbigtn" | "webpbigtn"
  ) {
    const gg = await this.getGG();
    const path = `${type}/${hash.replace(/^.*(..)(.)$/, "$2/$1/" + hash)}.${
      { avifbigtn: "avif", avifsmallbigtn: "avif", webpbigtn: "webp" }[type]
    }`;
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
      ) + "tn";
    return await fetch(`https://${subdomain}.${domain}/${path}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://hitomi.la/",
      },
    }).then((x) => x.arrayBuffer());
  }

  public static async getSuggestion(query: string) {
    const [field, key] = await this.getFieldAndKeyFromQuery(query);
    const node = await this.getNode(field as any);
    const data = await this.BSearch(field as any, key, node);
    if (!data) return [];
    const result = await this.getSuggestionWithData(field as any, data);
    return result;
  }

  public static async getSearch(
    query: string,
    language: HitomiLanguage = "all"
  ) {
    const terms = query
      .split(" ")
      .map((x) => x.replace(/_/g, " "))
      .map((x) => x.trim())
      .filter((x) => x);
    const positive = terms.filter((x) => !x.startsWith("-"));
    if (
      !positive.some((x) => x.startsWith("language:")) &&
      language !== "all"
    ) {
      positive.push(`language:${language}`);
    }
    const negative = terms.filter((x) => x.startsWith("-"));
    let results =
      (positive.length > 0
        ? await this.getIdsWithQuery(positive.pop()!)
        : await this.getIds("index", "all")) || [];
    await Promise.all(
      negative.map((x) => this.getIdsWithQuery(x).then((x) => x || []))
    ).then((x) =>
      x
        .filter((x) => x)
        .sort((a, b) => a.length - b.length)
        .map((x) => {
          const set = new Set(x);
          results = results.filter((c) => !set.has(c));
        })
    );
    await Promise.all(
      positive.map((x) => this.getIdsWithQuery(x).then((x) => x || []))
    ).then((x) =>
      x
        .sort((a, b) => a.length - b.length)
        .map((x) => {
          if (x.length > results.length) {
            const set = new Set(x);
            results = results.filter((c) => set.has(c));
          } else {
            const set = new Set(results);
            results = x.filter((c) => set.has(c));
          }
        })
    );
    return results;
  }

  private static async getIds(tag: string, lang: string, area?: string) {
    const cached = await this.cache.get<number[]>(
      `ids:${tag}:${lang}:${area || ""}`
    );
    if (cached) return cached;
    const url = `https://${domain}/${compressed_nozomi_prefix}/${
      area ? `${area}/` : ""
    }${tag}-${lang}.nozomi`;
    const res = fetch(url, {
      next: {
        revalidate: 600,
      },
    })
      .then((x) => x.arrayBuffer())
      .then(this.parseIntArray);

    this.cache.set(`ids:${tag}:${lang}:${area || ""}`, res, {
      ex: 600,
    });
    return res;
  }

  private static async getIdsWithQuery(query: string) {
    const cached = await this.cache.get<number[]>(`ids:${query}`);
    if (cached) return cached;
    query = query.replace(/_/g, " ");
    if (query.includes(":")) {
      const [ns, tag] = query.split(":");
      if (["female", "male"].includes(ns)) {
        return await this.getIds(query, "all", "tag").then(
          (x) => (
            this.cache.set(`ids:${query}`, x, {
              ex: 600,
            }),
            x
          )
        );
      } else if (ns == "language") {
        return await this.getIds("index", tag).then(
          (x) => (
            this.cache.set(`ids:${query}`, x, {
              ex: 600,
            }),
            x
          )
        );
      }
      return await this.getIds(tag, "all", ns).then(
        (x) => (
          this.cache.set(`ids:${query}`, x, {
            ex: 600,
          }),
          x
        )
      );
    }

    const field = "galleries",
      key = await hash(query);
    const node = await this.getNode(field);
    const data = await this.BSearch(field, key, node);
    if (!data) return [];
    const result = await this.getGalleriesWithData(data);
    return result;
  }

  private static parseIntArray(buffer: ArrayBuffer) {
    const view = new DataView(buffer);

    const result: number[] = [];
    for (let i = 0; i < view.byteLength; i += 4) {
      result.push(view.getInt32(i, false));
    }
    return result;
  }

  private static async getGG() {
    let code = await fetch(`https://ltn.${domain}/gg.js`, {
      next: {
        revalidate: 60 * 60, // 1 hour
      },
    }).then((x) => x.text());

    return parseGG(code!);
  }

  private static async getFieldAndKeyFromQuery(
    query: string
  ): Promise<[string, ArrayBuffer]> {
    if (query.includes(":"))
      return [query.split(":")[0], await hash(query.split(":")[1])];
    return ["global", await hash(query)];
  }

  // #region Search

  /**
   * Get root node of field
   * @param field global, galleries, languages, nozomiurl
   * @param address address of node
   * @returns
   */
  private static async getNode(
    field: "global" | "galleries" | "languages" | "nozomiurl",
    address = 0
  ): Promise<BNode> {
    const cached = await this.cache.get<BNode>(`${field}_${address}`);
    if (cached) return cached;

    const indexDir = IndexOfField[field] ?? IndexOfField["global"];
    const indexVersion = await this.getIndexVersion(indexDir);
    const url = `https://${domain}/${indexDir}/${field}.${indexVersion}.index`;

    async function decodeNode(data: ArrayBuffer): Promise<BNode> {
      let view = new DataView(data);
      let pos = 0;

      const number_of_keys = view.getInt32(pos);
      pos += 4;

      const keys = [];
      for (let i = 0; i < number_of_keys; i++) {
        const key_size = view.getInt32(pos);
        if (!key_size || key_size > 32) {
          throw new Error("fatal: !key_size || key_size > 32");
        }
        pos += 4;

        keys.push(data.slice(pos, pos + key_size));
        pos += key_size;
      }

      const number_of_datas = view.getInt32(pos);
      pos += 4;

      const datas = [];
      for (let i = 0; i < number_of_datas; i++) {
        const offset = view.getBigUint64(pos);
        pos += 8;

        const length = view.getInt32(pos);
        pos += 4;

        datas.push({ offset, length });
      }

      const number_of_subnodes = B;
      let subnodes = [];
      for (let i = 0; i <= number_of_subnodes; i++) {
        let subnode_address = view.getBigUint64(pos, false /* big-endian */);
        pos += 8;

        subnodes.push(subnode_address);
      }

      return { keys, datas, subnodes };
    }

    const res = await fetch(url, {
      headers: {
        Range: `bytes=${address}-${address + max_node_size - 1}`,
      },
      next: {
        revalidate: 600,
      },
    })
      .then((x) => x.arrayBuffer())
      .then(decodeNode);

    return res;
  }

  /**
   * Get suggestion data with data
   * @param data data of node
   * @returns suggestion data
   */
  private static async getSuggestionWithData(
    field: "global" | "galleries" | "languages" | "nozomiurl",
    data: BData
  ) {
    const indexDir = IndexOfField[field] ?? IndexOfField["global"];
    const indexVersion = await this.getIndexVersion(indexDir);
    const url = `https://${domain}/${indexDir}/${field}.${indexVersion}.data`;
    const { offset, length } = data;
    if (length > 10000 || length <= 0)
      throw new Error(`length ${length} is too long"`);

    async function decodeSuggestion(data: ArrayBuffer) {
      let view = new DataView(data);
      let pos = 0;
      const suggestions = [];
      const number_of_suggestions = view.getInt32(pos);
      pos += 4;
      if (number_of_suggestions > 100 || number_of_suggestions <= 0)
        throw new Error(
          `number of suggestions ${number_of_suggestions} is too long`
        );

      for (let i = 0; i < number_of_suggestions; i++) {
        let ns = "";
        let top = view.getInt32(pos);
        pos += 4;
        for (let j = 0; j < top; j++) {
          ns += String.fromCharCode(view.getUint8(pos++));
        }

        let tag = "";
        top = view.getInt32(pos);
        pos += 4;
        for (let j = 0; j < top; j++) {
          tag += String.fromCharCode(view.getUint8(pos++));
        }

        const count = view.getInt32(pos);
        pos += 4;

        const tagname = tag.replace(/[\/#]/, "");
        let url = `/${ns}/${tagname}-all-1.html`;
        if (ns === "female" || ns === "male") {
          url = `/tag/${ns}:${tagname}-all-1.html`;
        } else if (ns === "language") {
          url = `/index-${tagname}-1.html`;
        }
        suggestions.push({
          tag,
          count,
          url,
          ns,
        });
      }
      return suggestions;
    }

    const res = await fetch(url, {
      headers: {
        Range: `bytes=${offset}-${offset + BigInt(length - 1)}`,
      },
      next: {
        revalidate: 600,
      },
    })
      .then((x) => x.arrayBuffer())
      .then(decodeSuggestion);

    return res;
  }

  /**
   * Get galleries data with data
   * @param data data of node
   */
  private static async getGalleriesWithData(data: BData) {
    const field = "galleries";
    const indexDir = IndexOfField[field];
    const indexVersion = await this.getIndexVersion(indexDir);
    const url = `https://${domain}/${indexDir}/${field}.${indexVersion}.data`;
    const { offset, length } = data;
    if (length > 100000000 || length <= 0)
      throw new Error(`length ${length} is too big or too small`);

    async function decode(data: ArrayBuffer) {
      let view = new DataView(data);
      let pos = 0;
      const galleryids = [];
      const number_of_galleryids = view.getInt32(pos);
      pos += 4;

      const expected_length = 4 + 4 * number_of_galleryids;
      if (number_of_galleryids > 10000000 || number_of_galleryids <= 0)
        throw new Error(
          `number of galleryids ${number_of_galleryids} is too big or too small`
        );

      if (data.byteLength !== expected_length)
        throw new Error(
          `length of data ${data.byteLength} is not expected ${expected_length}`
        );

      for (let i = 0; i < number_of_galleryids; i++) {
        galleryids.push(view.getInt32(pos));
        pos += 4;
      }

      return galleryids;
    }

    const res = await fetch(url, {
      headers: {
        Range: `bytes=${offset}-${offset + BigInt(length - 1)}`,
      },
      next: {
        revalidate: 600,
      },
    })
      .then((x) => x.arrayBuffer())
      .then(decode);

    return res;
  }

  /**
   * Search B- tree with key
   * @param field global, galleries, languages, nozomiurl
   * @param key key to search
   * @param node node to search
   * @returns data of key
   */
  private static async BSearch(
    field: "global" | "galleries" | "languages" | "nozomiurl",
    key: ArrayBuffer,
    node: BNode
  ): Promise<BData | null> {
    function compare_arraybuffers(d1: ArrayBuffer, d2: ArrayBuffer) {
      let dv1 = new Uint8Array(d1),
        dv2 = new Uint8Array(d2);
      const top = Math.min(dv1.byteLength, dv2.byteLength);
      for (let i = 0; i < top; i++) {
        if (dv1[i] < dv2[i]) {
          return -1;
        } else if (dv1[i] > dv2[i]) {
          return 1;
        }
      }
      return 0;
    }
    function locateKey(key: ArrayBuffer, node: BNode) {
      let cmp_result = -1,
        i;
      for (
        i = 0;
        i < node.keys.length &&
        (cmp_result = compare_arraybuffers(key, node.keys[i])) > 0;
        i++
      );
      return {
        found: !cmp_result,
        index: i,
      };
    }
    function isLeaf(node: BNode) {
      return !node.subnodes.some((x) => x);
    }
    if (!node.keys.length) {
      return null;
    }

    const { found, index } = locateKey(key, node);
    if (found) return node.datas[index];
    else if (isLeaf(node)) return null;
    else {
      const subnode_address = node.subnodes[index];
      if (!subnode_address) return null;
      const subnode = await this.getNode(field, Number(subnode_address));
      return await this.BSearch(field, key, subnode);
    }
  }

  private static async getIndexVersion(name: string) {
    if (await this.cache.get(`${name}_version`)) {
      return await this.cache.get(`${name}_version`);
    }

    return await fetch(
      `https://${domain}/${name}/version?_=${Date.now()}`
    ).then((x) => x.text());
  }

  // #endregion Search
}

async function hash(message: string): Promise<ArrayBuffer> {
  const msgBuffer = new TextEncoder().encode(message);

  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  return new Uint8Array(hashBuffer).subarray(0, 4).buffer;
}
