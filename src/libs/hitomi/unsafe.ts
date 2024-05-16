export async function getGG() {
  let gg = {};

  const res = await fetch("https://ltn.hitomi.la/gg.js")
    .then((x) => x.text())
    .then((x) => new Function("let gg;" + x + "return gg;")());

  return res;
}
