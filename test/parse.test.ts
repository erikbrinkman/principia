import parse from "../parse.ts";
import { assertEquals } from "./deps.ts";
import { readExample } from "./utils.ts";

for (
  const [style, name, format] of [["absolute_comparison", "jeanluc", "csv"], [
    "relative_comparison",
    "jeanluc",
    "csv",
  ]]
) {
  Deno.test(`${style.replace(" ", "_")} ${name} ${format}`, async () => {
    const [csv, json] = await Promise.all([
      readExample(style, name, format),
      readExample(style, name, "json"),
    ]);
    const config = parse(csv, 2);
    assertEquals(config, JSON.parse(json));
  });
}
