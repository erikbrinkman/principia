import { readTextFile } from "./utils.ts";
import parse from "./parse.ts";
import plot, { Config, isConfig } from "./plot/mod.tsx";
import render, { Format } from "./render/mod.ts";
import createLogger from "./log.ts";

/** render principia image
 *
 * This function takes a string input, tries to figure out what type of
 * file it is, and then finishes rendering it according to principia presets.
 */
export default async function auto(
  input: string,
  output: string | Deno.Writer,
  { verbosity = 0, format }: { verbosity?: number; format?: Format },
): Promise<void> {
  const log = createLogger("auto:", verbosity);
  const enc = new TextEncoder();

  if (input.startsWith("<svg")) {
    log.info("found svg, starting render");
    const inputBuffer = new Deno.Buffer(enc.encode(input));
    await render(inputBuffer, output, { format, verbosity });
  } else {
    let conf;
    try {
      const json = JSON.parse(input);
      if (isConfig(json)) {
        log.info("found valid config json, starting plot");
        conf = json;
      } else {
        log.info("found invalid config json, starting parse");
        conf = parse(input, verbosity);
      }
    } catch (ex) {
      if (ex instanceof SyntaxError) {
        log.info("didn't find svg or json, starting parse");
        conf = parse(input, verbosity);
      } else {
        throw ex;
      }
    }
    const svg = plot(conf, { verbosity });
    const buff = new Deno.Buffer(enc.encode(svg));
    await render(buff, output, { format, verbosity });
  }
}
