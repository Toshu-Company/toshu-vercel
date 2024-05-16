export const HitomiLanguages = [
  "indonesian",
  "javanese",
  "catalan",
  "cebuano",
  "czech",
  "danish",
  "german",
  "estonian",
  "english",
  "spanish",
  "esperanto",
  "french",
  "hindi",
  "icelandic",
  "italian",
  "latin",
  "hungarian",
  "dutch",
  "norwegian",
  "polish",
  "portuguese",
  "romanian",
  "albanian",
  "slovak",
  "serbian",
  "finnish",
  "swedish",
  "tagalog",
  "vietnamese",
  "turkish",
  "greek",
  "bulgarian",
  "mongolian",
  "russian",
  "ukrainian",
  "hebrew",
  "arabic",
  "persian",
  "thai",
  "korean",
  "chinese",
  "japanese",
] as const;
export type HitomiLanguage = (typeof HitomiLanguages)[number] | "all";

export function isHitomiLanguage(x: any): x is HitomiLanguage {
  return HitomiLanguages.includes(x);
}

export const IndexOfField = {
  global: "tagindex",
  galleries: "galleriesindex",
  languages: "languagesindex",
  nozomiurl: "nozomiurlindex",
};
export interface BNode {
  keys: ArrayBuffer[];
  datas: BData[];
  subnodes: bigint[];
}

export interface BData {
  offset: bigint;
  length: number;
}
