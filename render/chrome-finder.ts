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

export async function linux(): Promise<string> {
  const paths = await Promise.all(executables.map(whichPath));
  const [path] = paths.filter((p) => p !== null);
  if (path) {
    return path;
  } else {
    throw new Error("couldn't find a chrome executable");
  }
}
