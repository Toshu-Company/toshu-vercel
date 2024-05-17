import Sandbox from "@nyariv/sandboxjs";

const sandbox = new Sandbox();

interface Context {
  gg: {
    b: string;
    s: (x: string) => string;
    m: (x: number) => number;
  };
}

export async function parseGG(code: string) {
  let context: Context = { gg: {} } as any;

  sandbox.compile(code)(context).run();

  return context.gg;
}
