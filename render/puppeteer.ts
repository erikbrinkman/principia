// FIXME move back to pptr?
import { PuppeteerDeno } from "https://deno.land/x/puppeteer@9.0.0/src/deno/Puppeteer.ts";
export type {
  JSONObject,
} from "https://deno.land/x/puppeteer@9.0.0/vendor/puppeteer-core/puppeteer/common/EvalTypes.d.ts";
export type {
  JSHandle,
} from "https://deno.land/x/puppeteer@9.0.0/vendor/puppeteer-core/puppeteer/common/JSHandle.d.ts";
// @deno-types="https://deno.land/x/puppeteer@9.0.0/vendor/puppeteer-core/puppeteer/common/Browser.d.ts";
import { Browser } from "https://deno.land/x/puppeteer@9.0.0/vendor/puppeteer-core/puppeteer/common/Browser.js";
export { Browser };

const executables = [
  "google-chrome-stable",
  "google-chrome",
  "chromium-browser",
  "chromium",
];

async function whichPath(name: string): Promise<string | null> {
  const proc = Deno.run({
    cmd: [
      "which",
      name,
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { code } = await proc.status();

  if (code === 0) {
    const rawOutput = await proc.output();
    const outputString = new TextDecoder().decode(rawOutput);
    return outputString.trimEnd();
  } else {
    const rawError = await proc.stderrOutput();
    if (rawError.length) {
      const errorString = new TextDecoder().decode(rawError);
      throw new Error(errorString);
    } else {
      return null;
    }
  }
}

async function linux(): Promise<string> {
  const paths = await Promise.all(executables.map(whichPath));
  const [path] = paths.filter((p) => p !== null);
  if (path) {
    return path;
  } else {
    throw new Error("couldn't find a chrome executable");
  }
}

const puppeteer = new PuppeteerDeno({
  preferredRevision: "",
  productName: "chrome",
});

export default async function launch(): Promise<Browser> {
  const executablePath = await linux();
  // NOTE set env here to avoid inhereting it
  return await puppeteer.launch({ executablePath, env: {} });
  // TODO a promise always gets left here, need to figure out why
}
