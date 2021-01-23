import {
  compile,
  d3,
  JSONSchemaType,
  React,
  ReactDOMServer,
  ReactElement,
} from "../deps.ts";
import Evolution from "./evolution.tsx";
import AbsoluteComparison from "./absolute-comparison.tsx";
import genStyle, { Variables } from "./style.ts";

type ChartTypes = { type: "absolute comparison" | "evolution" };

const filterSchema: JSONSchemaType<ChartTypes> = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["absolute comparison", "evolution"] },
  },
  required: ["type"],
};

const isValid = compile(filterSchema);

// FIXME Add / migrate tests

export default async function plot(
  input: string | Deno.Reader,
  output: string | Deno.Writer,
  variables: Variables,
  styles: string[],
  themes: Record<string, Record<string, string>>,
): Promise<void> {
  const textConfig =
    await (typeof input === "string"
      ? Deno.readTextFile(input)
      : Deno.readAll(input).then((raw) => new TextDecoder().decode(raw)));
  const config = JSON.parse(textConfig);

  if (!isValid(config)) {
    const messages = (isValid.errors || []).map(({ dataPath, message }) =>
      `${dataPath}: ${message}`
    )
      .join("\n");
    throw new Error(
      `input config didn't have a valid type field:\n${messages}`,
    );
  }

  let contents: ReactElement;
  switch (config.type) {
    case "absolute comparison": {
      contents = <AbsoluteComparison {...config} />;
      break;
    }
    case "evolution": {
      contents = <Evolution {...config} />;
      break;
    }
    default: {
      throw new Error("internal error: unhandled chart type");
    }
  }

  async function writeResult(
    writer: Deno.Writer,
  ): Promise<void> {
    const encoder = new TextEncoder();
    const raw = ReactDOMServer.renderToStaticMarkup(
      <svg>
        <style>
          {genStyle(variables, themes)}
          {"\n\n"}
          {styles.join("\n\n")}
        </style>
        {contents}
      </svg>,
    );
    await Deno.writeAll(writer, encoder.encode(raw));
    await writer.write(encoder.encode("\n"));
  }

  if (typeof output === "string") {
    const file = await Deno.open(output, { write: true, create: true });
    try {
      await writeResult(file);
    } finally {
      Deno.close(file.rid);
    }
  } else {
    await writeResult(output);
  }
}
