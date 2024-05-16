import Sandbox from "@nyariv/sandboxjs";

const sandbox = new Sandbox();

interface Context {
  gg: {
    b: string;
    s: (x: string) => string;
    m: (x: number) => number;
  };
}

export async function getGG() {
  let context: Context = { gg: {} } as any;

  const res = await fetch("https://ltn.hitomi.la/gg.js").then((x) => x.text());

  sandbox.compile(res)(context).run();

  console.log(context);

  return context.gg;
}
