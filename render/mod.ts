import { AlignArgs, loadFunctions } from "./dom/mod.ts";
import { validateStringUnion, writeTextFile } from "../utils.ts";
import launch, { JSHandle, JSONObject } from "./puppeteer.ts";
import createLogger from "../log.ts";

export const formats = ["pdf", "png", "jpg", "jpeg", "html", "svg"] as const;
export type Format = (typeof formats)[number];

export default async function render(
  input: string | Deno.Reader,
  output: string | Deno.Writer,
  { format, alignments = {}, verbosity = 0, scale = 2, quality = 98 }: {
    format?: Format;
    alignments?: AlignArgs;
    verbosity?: number;
    scale?: number;
    quality?: number;
  } = {},
): Promise<void> {
  const log = createLogger("render:", verbosity);

  // derive format
  if (!format) {
    if (typeof output === "string") {
      const extension = output.split(".").pop()!.toLowerCase();
      if (validateStringUnion(formats, extension)) {
        format = extension;
      } else {
        const formatsString = [...formats].join(", ");
        throw new Error(
          `output extension wasn't one of ${formatsString} (${extension}); ` +
            "either this is an error, or you should manually specify the output format",
        );
      }
    } else {
      format = "pdf";
    }
  }
  log.info("using output format:", format);

  // start loading these right away
  const functionPromises = loadFunctions();

  const svgData =
    await (typeof input === "string"
      ? Deno.readTextFile(input)
      : Deno.readAll(input).then((raw) => new TextDecoder().decode(raw)));

  const browser = await launch();
  try {
    log.debug("launched browser");
    const page = await browser.newPage();
    await page.goto(
      `data:text/html;charset=utf-8,${encodeURIComponent(svgData)}`,
      {
        waitUntil: "networkidle0",
      },
    );
    log.debug("loaded page");

    // log console if verbose
    if (verbosity) {
      page.on("console", async (msg) => {
        const args = await Promise.all(
          msg.args().map((arg: JSHandle) => page.evaluate((v) => v, arg)),
        );
        console.error(`console.${msg.type()}:`, ...args);
      });
    }
    // remove margin
    await page.addStyleTag({ content: "body { margin: 0; }" });

    const [alignFunc, svgFunc, sizeFunc] = await functionPromises;

    // NOTE technically undefined values aren't serializable, but omitted ones
    // are, so this is actually okay
    // FIXME
    //await page.evaluate(alignFunc, alignments as JSONObject);
    log.debug("aligned");

    // get final size
    const { width, height } = await page.evaluate(sizeFunc);
    log.debug("measured:", width, "x", height);

    // write rendered result
    if (format === "pdf") {
      if (typeof output === "string") {
        await page.pdf({ path: output, pageRanges: "1", width, height });
      } else {
        const buff = await page.pdf({ pageRanges: "1", width, height });
        await Deno.copy(new Deno.Buffer(buff), output);
      }
    } else if (format === "png" || format === "jpg" || format === "jpeg") {
      // get viewport for scaling
      const viewport = page.viewport();
      if (viewport === null) {
        return log.panic("couldn't get current viewport");
      }
      // set scale
      await page.setViewport({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: scale,
      });
      // write output
      if (typeof output === "string") {
        await page.screenshot({
          path: output,
          type: format === "png" ? "png" : "jpeg",
          quality: format === "png" ? undefined : quality,
          clip: { x: 0, y: 0, width, height },
        });
      } else {
        const buff = await page.screenshot({
          encoding: "binary",
          type: format === "png" ? "png" : "jpeg",
          quality: format === "png" ? undefined : quality,
          clip: { x: 0, y: 0, width, height },
        });
        if (!(buff instanceof Uint8Array)) {
          return log.panic("screenshot returned unexpected type");
        }
        await Deno.copy(new Deno.Buffer(buff), output);
      }
    } else if (format === "html") {
      const html = await page.content();
      if (typeof output === "string") {
        await Deno.writeTextFile(output, html);
      } else {
        await Deno.writeAll(output, new TextEncoder().encode(html));
      }
    } else if (format === "svg") {
      const svg = await page.evaluate(svgFunc);
      await writeTextFile(output, svg);
    } else {
      log.panic("unknown output format:", format);
    }
    log.debug("output");
  } catch (ex) {
    // FIXME this shouldn't be necessary, but it's getting shadowed by final bug error in puppeteer
    log.warning(ex);
  } finally {
    await functionPromises;
    await browser.close();
  }
}
