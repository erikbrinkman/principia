import {
  CSSProperties,
  d3,
  JTDSchemaType,
  React,
  ReactElement,
} from "./deps.ts";
import {
  ContinuousScale,
  Formatter,
  Point,
  pointMap,
  points,
} from "./config.ts";
import { assert } from "../utils.ts";

interface Datum {
  name: string;
  value: number;
  color?: string;
}

const datumSchema: JTDSchemaType<Datum> = {
  properties: {
    name: { type: "string" },
    value: { type: "float64" },
  },
  optionalProperties: {
    color: { type: "string" },
  },
};

interface PointConfig {
  type?: Point;
  size?: number;
}

const pointSchema: JTDSchemaType<PointConfig> = {
  optionalProperties: {
    type: { enum: points },
    size: { type: "float64" },
  },
};

interface LabelConfig {
  height?: number;
  gap?: number;
  color?: string;
}

const labelSchema: JTDSchemaType<LabelConfig> = {
  optionalProperties: {
    height: { type: "float64" },
    gap: { type: "float64" },
    color: { type: "string" },
  },
};

interface AxisConfig {
  height?: number;
  gap?: number;
  format?: string;
  color?: string;
}

const axisSchema: JTDSchemaType<AxisConfig> = {
  optionalProperties: {
    height: { type: "float64" },
    gap: { type: "float64" },
    format: { type: "string" },
    color: { type: "string" },
  },
};

interface Config {
  data: Datum[];
  height?: number;
  point?: PointConfig;
  label?: LabelConfig;
  axis?: AxisConfig;
  merge?: boolean;
  theme?: string;
}

export const relativeComparisonSchema: JTDSchemaType<Config> = {
  properties: {
    data: {
      elements: datumSchema,
    },
  },
  optionalProperties: {
    height: { type: "float64" },
    point: pointSchema,
    label: labelSchema,
    axis: axisSchema,
    merge: { type: "boolean" },
    theme: { type: "string" },
  },
};

function Item({
  name,
  value,
  color,
  loc,
  height,
  pointPath,
  formatter,
}: Datum & {
  loc: number;
  height: number;
  pointPath: string;
  formatter: Formatter;
}): ReactElement {
  return (<g
    className="princ-item"
    style={{
      "--color": color,
      transform: `translateY(calc(var(--height, ${height}) * ${loc}px))`,
    } as CSSProperties}
  >
  </g>);
}

function mergeData(
  data: Datum[],
  formatter: Formatter,
): Datum[] {
  const merged = new Map<
    string,
    { names: string[]; value: number; color?: string }
  >();
  // TODO handle merging better, e.g. keep names in order of value instead of
  // lexicographic, keep them separate the whole time, allowing the labels to be
  // colorered, etc.
  for (const { name, value, color } of data) {
    const key = formatter(value);
    const val = merged.get(key);
    if (val) {
      val.color = val.color || color;
      if (color && color !== val.color) {
        throw new Error(
          "specified two different colors for merged labels with the same formatted value. This probably indicates an error somewhere or a violation of expectations.",
        );
      }
      val.names.push(name);
      val.value += (value - val.value) / val.names.length;
    } else {
      merged.set(key, { names: [name], value, color });
    }
  }
  return [...merged.values()].map(({ names, value, color }) => ({
    name: names.sort().join(", "),
    value,
    color,
  }));
}

// FIXME Add title
export default function RelativeComparison(
  {
    data,
    theme = "jeanluc-red",
    height = 20,
    point = {},
    axis = {},
    label = {},
    merge = true,
  }: Config,
): ReactElement {
  // FIXME need to manually assert anything of import here, e.g. width > 0, and
  // in all of these classes
  const { format = "" } = axis;
  const { type: pointType = "circle" } = point;
  const formatter = d3.format(format);
  const min = Math.min(...data.map(({ value }) => value));
  const max = Math.max(...data.map(({ value }) => value));
  const scale = d3.scaleLinear([min, max], [data.length, 0]);
  const pointPath = d3.symbol(pointMap[pointType], 1)();
  assert(pointPath !== null);

  /*
  if (merge) {
    data = mergeData(data, formatter);
  }

  const itemElems = data.map((datum, i) =>
    <Item
      key={i}
      {...datum}
      loc={scale(datum.value)}
      height={height}
      pointPath={pointPath}
      formatter={formatter}
    />
  );
   */
  const itemElems = null;

  return (
    <g className={theme}>
      <g className="princ-relcomp">{itemElems}</g>
    </g>
  );
}

export type RelativeComparisonConfig = Config;
