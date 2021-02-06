import plot, { isConfig } from "../plot/mod.tsx";
import { assert } from "./deps.ts";
import { readExample } from "./utils.ts";

for (
  const [style, name] of [
    ["absolute_comparison", "jeanluc"],
    ["absolute_comparison", "jeanluc_title"],
    [
      "relative_comparison",
      "jeanluc",
    ],
  ]
) {
  Deno.test(`${style.replace(" ", "_")} ${name}`, async () => {
    const config = JSON.parse(await readExample(style, name, "json"));
    assert(isConfig(config));
    const svg = plot(config, { verbosity: 2 });
    // FIXME better assertions about svg
    assert(svg.length);
    assert(svg.startsWith("<svg"));
    assert(svg.endsWith("</svg>"));
  });
}
