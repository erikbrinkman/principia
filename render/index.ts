import { JSHandle, JSONObject, puppeteer } from "../deps.ts";
import { linux } from "./chrome-finder.ts";
import align, { AlignArgs } from "./adjust.ts";

async function loadRelative(relative: string): Promise<string> {
  const url = new URL(relative, import.meta.url);
  if (url.protocol === "file:") {
    return await Deno.readTextFile(url.pathname);
  } else {
    const resp = await fetch(url.href);
    return await resp.text();
  }
}

export type Format = "pdf" | "png" | "jpg" | "jpeg" | "html";
export const formats = new Set<Format>(["pdf", "png", "jpg", "jpeg", "html"]);

export default async function render(
  input: string | Deno.Reader,
  output: string | Deno.Writer,
  format: Format = "pdf",
  alignments: AlignArgs = {},
  { verbosity = 0, scale = 2, quality = 98 }: {
    verbosity?: number;
    scale?: number;
    quality?: number;
  } = {},
): Promise<void> {
  const svgData =
    await (typeof input === "string"
      ? Deno.readTextFile(input)
      : Deno.readAll(input).then((raw) => new TextDecoder().decode(raw)));

  const chromePath = await linux();
  const browser = await puppeteer.launch({ executablePath: chromePath });
  try {
    const page = await browser.newPage();
    await page.goto(
      `data:text/html;charset=utf-8,${encodeURIComponent(svgData)}`,
      {
        waitUntil: "networkidle0",
      },
    );
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
    // NOTE technically undefined values aren't serializable, but omitted ones
    // are, so this is actually okay
    await page.evaluate(align, alignments as JSONObject);

    // get final size
    const { width, height } = await page.evaluate(() => {
      // deno-lint-ignore no-undef
      const svg = document.getElementsByTagName("svg")[0];
      const sbbox = svg.getBBox();
      svg.setAttribute(
        "viewBox",
        [sbbox.x, sbbox.y, sbbox.width, sbbox.height].join(" "),
      );
      const rect = svg.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

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
      if (viewport === null) throw new Error("can't get current viewport");
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
          throw new Error("pptr screenshot returned unexpected type");
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
    } else {
      throw new Error(`unknown output format: ${format}`);
    }
  } finally {
    await browser.close();
  }
}
