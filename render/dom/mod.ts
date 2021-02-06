/** get functions for execution in dom
 *
 * Deno doesn't support dom manipulation, so in order to typecheck our dom
 * functions, we use Deno.emit to compile and typecheck them with the dom
 * library, and then pass those emited strings off to the headless browser. To
 * get the strings separated out, each gets its own file, and by including the
 * "bundle" file that includes all of them, we only need to call emit once. The
 * bridge function allows us to export the types to both dom and deno land.
 *
 * The advantage of this structure is that we get full typescript support of
 * our dom functions, and changing them requires less testing or integration.
 * The downside is that these now become a dynamic load, potentially costing
 * another permission check, although since it still uses the cache, it
 * shouldn't actually affect performance.
 *
 * It's also a little more complicated than just writing all of the functions
 * independently.
 */
import { AlignArgs, SvgSize } from "./bridge.ts";
export type { AlignArgs, SvgSize };

function parseFunction(raw: string): () => unknown {
  if (raw.startsWith('"use strict";\n')) {
    raw = raw.slice(14);
  }
  if (raw.endsWith("\nexport {};\n")) {
    raw = raw.slice(0, -12);
  }
  return new Function(`return ${raw};`)();
}

// NOTE the first function should be typed as AlignArgs, but the typing of
// evaluate won't allow it, and evaluate doesn't typecheck the arguments
// anyway, so it doesn't matter
export type Functions = [
  (args: unknown) => Promise<void>,
  () => string,
  () => SvgSize,
];

const functionFiles = ["align", "svg", "size"];

/** FIXME */
export async function loadFunctions(): Promise<Functions> {
  // FIXME request permissions before emit
  let diagnostics, files: Record<string, string>;
  try {
    ({ diagnostics, files } = await Deno.emit(
      new URL("./bundle.ts", import.meta.url),
      {
        compilerOptions: {
          lib: ["dom", "deno.ns"],
        },
      },
    ));
  } catch (ex) {
    console.error(ex);
    throw new Error("internal error: failed to parse dom functions");
  }
  if (diagnostics.length) {
    throw new Error(
      `internal error: type errors in dom functions: ${
        Deno.formatDiagnostics(diagnostics)
      }`,
    );
  }
  // NOTE the slice(0, -12) removes `export {};`
  // NOTE use newFunction to convert these back into functions, which is
  // necessary to pass arguments into them
  // NOTE, because these functions use dom constructs, they will fail if called
  return functionFiles.map((f) =>
    parseFunction(
      files[new URL(`./${f}.ts.js`, import.meta.url).href],
    )
  ) as unknown as Functions;
}
