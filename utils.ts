/** returns if a string is in the union specified */
export type StringUnion<T extends readonly string[]> = T[number];

export function validateStringUnion<T extends readonly string[]>(
  options: T,
  val: string,
): val is StringUnion<T> {
  return options.indexOf(val) >= 0;
}

/** compute mean of array */
export function mean(arr: number[]): number {
  if (arr.length) {
    return arr.reduce((a, v, i) => a + (v - a) / (i + 1), 0);
  } else {
    throw new Error("can't take mean of empty array");
  }
}

/** compute median of array */
export function median(arr: number[]): number {
  const ordered = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(ordered.length / 2);
  if (!ordered.length) {
    throw new Error("can't take median of empty array");
  } else if (ordered.length % 2 === 0) {
    return (ordered[mid - 1] + ordered[mid]) / 2;
  } else {
    return ordered[mid];
  }
}

/** return true if array is sorted ascending or descending */
export function isSorted(arr: number[]): boolean {
  const nexts = arr.slice(1);
  return nexts.every((v, i) => v >= arr[i]) ||
    nexts.every((v, i) => v <= arr[i]);
}

/** generic assert */
export function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error("failed condition");
  }
}

/** read a file as bytes */
export async function readFile(
  file: string | Deno.Reader,
): Promise<Uint8Array> {
  if (typeof file === "string") {
    await Deno.permissions.request({ name: "read", path: file });
    return await Deno.readFile(file);
  } else {
    return await Deno.readAll(file);
  }
}

/** read a file as a string */
export async function readTextFile(
  file: string | Deno.Reader,
): Promise<string> {
  const raw = await readFile(file);
  return new TextDecoder().decode(raw);
}

async function writeIterable(
  out: Deno.Writer,
  contents: Iterable<Uint8Array>,
): Promise<void> {
  for (const content of contents) {
    await Deno.writeAll(out, content);
  }
}

/** write bytes iterable to a file */
export async function writeFile(
  file: string | Deno.Writer,
  ...contents: Uint8Array[]
): Promise<void> {
  if (typeof file === "string") {
    await Deno.permissions.request({ name: "write", path: file });
    const fil = await Deno.open(file, { write: true, create: true });
    try {
      await writeIterable(fil, contents);
    } finally {
      Deno.close(fil.rid);
    }
  } else {
    return await writeIterable(file, contents);
  }
}

/**
 * write string iterable to a file
 *
 * "-" is interpreted as stdout
 */
export async function writeTextFile(
  file: string | Deno.Writer,
  ...contents: string[]
): Promise<void> {
  const encoder = new TextEncoder();
  await writeFile(file, ...contents.map((cont) => encoder.encode(cont)));
}
