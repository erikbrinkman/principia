import auto from "../auto.ts";
import { assert } from "./deps.ts";
import { readExample } from "./utils.ts";

const configs = [[
  "absolute_comparison",
  "jeanluc",
  "csv",
  "html",
], [
  "relative_comparison",
  "jeanluc",
  "csv",
  "html",
]] as const;

for (
  const [style, name, format, output] of configs
) {
  Deno.test({
    name: `${style.replace(" ", "_")} ${name} ${format} to ${output}`,
    ignore: true,
    async fn() {
      const input = await readExample(style, name, format);
      const buff = new Deno.Buffer();
      await auto(input, buff, { verbosity: 2, format: output });
      assert(buff.length);
    },
  });
}
