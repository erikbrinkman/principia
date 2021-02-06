import render from "../render/mod.ts";
import { assert } from "./deps.ts";
import { readExample } from "./utils.ts";

const configs = [
  ["absolute_comparison", "jeanluc"],
] as const;

for (
  const [style, name] of configs
) {
  Deno.test({
    name: `${style.replace(" ", "_")} ${name}`,
    async fn() {
      const buff = new Deno.Buffer();
      // FIXME test more formats, as well as file vs buffer output
      await render(
        new URL(`./${style}.ex.${name}.svg`, import.meta.url).href,
        buff,
        { format: "html", verbosity: 2 },
      );
      // FIXME better assertions about output
      assert(buff.length);
    },
  });
}
