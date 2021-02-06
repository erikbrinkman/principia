// FIXME remove hyphens from paths, acording to deno style
import {
  Ajv,
  JTDSchemaType,
  React,
  ReactDOMServer,
  ReactElement,
} from "./deps.ts";
import genStyle, { Themes } from "./style.ts";
import AbsoluteComparison, {
  AbsoluteComparisonConfig,
  absoluteComparisonSchema,
} from "./absolute-comparison.tsx";
import RelativeComparison, {
  RelativeComparisonConfig,
  relativeComparisonSchema,
} from "./relative-comparison.tsx";
import Evolution, { EvolutionData, evolutionSchema } from "./evolution.tsx";

// FIXME add support for font weight / family?

export type Config =
  | { type: "absolute comparison" } & AbsoluteComparisonConfig
  | { type: "relative comparison" } & RelativeComparisonConfig
  | { type: "evolution" } & EvolutionData;

const configSchema: JTDSchemaType<Config> = {
  discriminator: "type",
  mapping: {
    "absolute comparison": absoluteComparisonSchema,
    "relative comparison": relativeComparisonSchema,
    "evolution": evolutionSchema,
  },
};

const ajv = new Ajv();
export const isConfig = ajv.compile(configSchema);

function genElem(config: Config): ReactElement {
  switch (config.type) {
    case "absolute comparison": {
      return <AbsoluteComparison {...config} />;
    }
    case "relative comparison": {
      return <RelativeComparison {...config} />;
    }
    case "evolution": {
      return <Evolution {...config} />;
    }
    default: {
      throw new Error("internal error: unhandled chart type");
    }
  }
}

export default function plot(
  config: Config,
  {
    extraStyle = "",
    customThemes = {},
    verbosity = 0,
  }: {
    extraStyle?: string;
    customThemes?: Themes;
    verbosity?: number;
  } = {},
): string {
  const elem = genElem(config);
  const style = genStyle(extraStyle, customThemes);
  return ReactDOMServer.renderToStaticMarkup(
    <svg>
      <style>{style}</style>
      {elem}
    </svg>,
  );
}
