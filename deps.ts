// yargs
export { default as yargs } from "https://deno.land/x/yargs@v16.2.0-deno/deno.ts";
// puppeteer
export { default as puppeteer } from "https://deno.land/x/pptr@1.0.3/mod.ts";
export type { JSHandle } from "https://deno.land/x/pptr@1.0.3/src/JSHandle.ts";
export type { JSONObject } from "https://deno.land/x/pptr@1.0.3/src/EvalTypes.ts";
// react
export { default as React } from "https://esm.sh/react@17.0.1";
export type { CSSProperties, ReactElement } from "https://esm.sh/react@17.0.1";
export { default as ReactDOMServer } from "https://esm.sh/react-dom@17.0.1/server";
// ajv
import Ajv from "https://cdn.skypack.dev/ajv@7.0.3";
// TODO types seem to also be broken for ajv, so this is a work around...
import { JSONSchemaType } from "https://raw.githubusercontent.com/ajv-validator/ajv/v7.0.3/lib/types/json-schema.ts";
export type { JSONSchemaType };
const ajv = new Ajv();

export const compile = <T>(inp: JSONSchemaType<T>) =>
  ajv.compile(inp) as ((json: unknown) => json is T) & {
    errors: { dataPath: string; message: string }[] | null;
  };
// d3
export * as d3 from "https://esm.sh/d3@6.5.0";
// word wrap
export { default as wrap } from "https://esm.sh/word-wrap@1.2.3";
