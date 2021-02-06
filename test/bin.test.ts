import { assert, assertStrictEquals } from "./deps.ts";

const exec = new URL("../bin.ts", import.meta.url).pathname;

// FIXME this should test prompting for permission if possible

async function run(
  cmd: string,
  input: string,
  output: string,
  ...args: string[]
): Promise<void> {
  // render needs all of the permissions
  const perms = cmd === "render"
    ? [
      `--allow-read=${input}`,
      `--allow-write=/tmp,${output}`,
      "--allow-run",
      "--allow-env", // FIXME What env do we need?
      "--allow-net=127.0.0.1",
      "--unstable", // FIXME
    ]
    : [
      `--allow-read=${input}`,
      `--allow-write=${output}`,
      "--unstable", // FIXME
    ];
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      ...perms,
      exec,
      "-i",
      input,
      "-o",
      output,
      cmd,
    ],
  });

  const { code } = await proc.status();
  assertStrictEquals(code, 0, "principia failed");

  proc.close();
}

Deno.test("prints help", async () => {
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "--unstable", // FIXME
      exec,
      "-h",
    ],
    stdout: "piped",
  });

  const { code } = await proc.status();
  assertStrictEquals(code, 0);

  const rawOutput = await proc.output();
  assert(rawOutput.length > 0);

  proc.close();
});

Deno.test("prints theme help", async () => {
  const proc = Deno.run({
    cmd: [
      "deno",
      "run",
      "--unstable", // FIXME
      exec,
      "plot",
      "--theme-help",
    ],
    stdout: "piped",
  });

  const { code } = await proc.status();
  assertStrictEquals(code, 0);

  const rawOutput = await proc.output();
  assert(rawOutput.length > 0);

  proc.close();
});

/*
Deno.test("converts evolution bachelor", async () => {
  const base = "./evolution.ex.bachelor";
  const jsonFile = new URL(`${base}.json`, import.meta.url).pathname;
  const svgFile = new URL(`${base}.svg`, import.meta.url).pathname;

  // convert to svg
  await run("plot", jsonFile, svgFile);

  // render
  const html = run(
    "render",
    svgFile,
    new URL(`${base}.html`, import.meta.url).pathname,
  );
  const png = run(
    "render",
    svgFile,
    new URL(`${base}.png`, import.meta.url).pathname,
  );
  const pdf = run(
    "render",
    svgFile,
    new URL(`${base}.pdf`, import.meta.url).pathname,
  );
  await Promise.all([html, png, pdf]);
});

Deno.test("converts evolution heart rate", async () => {
  const base = "./evolution.ex.heart_rate";
  const jsonFile = new URL(`${base}.json`, import.meta.url).pathname;
  const svgFile = new URL(`${base}.svg`, import.meta.url).pathname;

  // convert to svg
  await run("plot", jsonFile, svgFile);

  // render
  await run(
    "render",
    svgFile,
    new URL(`${base}.png`, import.meta.url).pathname,
  );
});

Deno.test("converts evolution with long rendering time", async () => {
  const base = "./evolution.ex.long_render";
  const jsonFile = new URL(`${base}.json`, import.meta.url).pathname;
  const svgFile = new URL(`${base}.svg`, import.meta.url).pathname;

  // convert to svg
  await run("plot", jsonFile, svgFile);

  // render
  await run(
    "render",
    svgFile,
    new URL(`${base}.png`, import.meta.url).pathname,
  );
});

Deno.test("converts absolute comparison", async () => {
  const base = "./absolute_comparison.ex.bachelor";
  const jsonFile = new URL(`${base}.json`, import.meta.url).pathname;
  const svgFile = new URL(`${base}.svg`, import.meta.url).pathname;

  // convert to svg
  await run("plot", jsonFile, svgFile);

  // render
  await run(
    "render",
    svgFile,
    new URL(`${base}.png`, import.meta.url).pathname,
  );
});

Deno.test("converts absolute comparison jeanluc", async () => {
  const base = "./absolute_comparison.ex.jeanluc";
  const jsonFile = new URL(`${base}.json`, import.meta.url).pathname;
  const svgFile = new URL(`${base}.svg`, import.meta.url).pathname;

  // convert to svg
  await run("plot", jsonFile, svgFile);

  // render
  await run(
    "render",
    svgFile,
    new URL(`${base}.png`, import.meta.url).pathname,
  );
});
*/
