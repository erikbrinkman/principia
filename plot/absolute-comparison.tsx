import {
  CSSProperties,
  d3,
  d3scale,
  JTDSchemaType,
  React,
  ReactElement,
} from "./deps.ts";
import { ContinuousScale, Formatter } from "./config.ts";

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

interface LabelConfig {
  gap?: number;
  height?: number;
  color?: string;
}

const labelSchema: JTDSchemaType<LabelConfig> = {
  optionalProperties: {
    gap: { type: "float64" },
    height: { type: "float64" },
    color: { type: "string" },
  },
};

interface AxisConfig {
  gap?: number;
  format?: string;
  height?: number;
  color?: string;
}

const axisSchema: JTDSchemaType<AxisConfig> = {
  optionalProperties: {
    gap: { type: "float64" },
    height: { type: "float64" },
    format: { type: "string" },
    color: { type: "string" },
  },
};

interface TitleConfig {
  name?: string;
  gap?: number;
  height?: number;
  color?: string;
}

const titleSchema: JTDSchemaType<TitleConfig> = {
  optionalProperties: {
    name: { type: "string" },
    gap: { type: "float64" },
    height: { type: "float64" },
    color: { type: "string" },
  },
};

interface Config {
  data: Datum[];
  height?: number;
  plot?: { width?: number; height?: number };
  label?: LabelConfig;
  axis?: AxisConfig;
  title?: TitleConfig;
  theme?: string;
  sort?: "asc" | "desc" | "off";
}

export const absoluteComparisonSchema: JTDSchemaType<Config> = {
  properties: {
    data: {
      elements: datumSchema,
    },
  },
  optionalProperties: {
    height: { type: "float64" },
    plot: {
      optionalProperties: {
        width: { type: "float64" },
        height: { type: "float64" },
      },
    },
    label: labelSchema,
    axis: axisSchema,
    title: titleSchema,
    theme: { type: "string" },
    sort: { enum: ["asc", "desc", "off"] },
  },
};

function Label(
  { name, color = "black", gap = 10, height = 14 }: LabelConfig & {
    name: string;
  },
): ReactElement {
  return (
    <g
      className="princ-label"
      style={{
        transform: `translateX(calc(var(--label-gap, ${gap}) * -1px))`,
        fill: `var(--label-color, ${color})`,
        fontSize: `calc(var(--label-height, ${height}) * 1px)`,
        dominantBaseline: "central",
        textAnchor: "end",
      }}
    >
      <g className="princ-align-label">
        <text>{name}</text>
      </g>
    </g>
  );
}

function Plot(
  { value, width, height }: {
    value: number;
    width: number;
    height: number;
  },
): ReactElement {
  // NOTE y isn't in CSSProperties
  return <rect
    className="princ-comparison"
    style={{
      height: `calc(var(--plot-height, ${height}) * 1px)`,
      y: `calc(var(--plot-height, ${height}) * -0.5px)`,
      width: `${value}`,
      transform: `scaleX(var(--plot-width, ${width}))`,
      fill: "var(--color)",
    } as CSSProperties}
  />;
}

function Axis(
  { value, gap = 10, format = "", color = "var(--jeanluc-grey)", height = 14 }:
    & AxisConfig
    & {
      value: number;
    },
): ReactElement {
  const formatted = d3.format(format)(value);
  return (
    <g
      className="princ-axis-label"
      style={{
        transform: `translateX(calc(var(--axis-gap, ${gap}) * 1px))`,
        fill: `var(--axis-color, ${color})`,
        fontSize: `calc(var(--axis-height, ${height}) * 1px)`,
        dominantBaseline: "central",
        textAnchor: "start",
      }}
    >
      <g className="princ-align-axis-label">
        <text>
          {formatted}
        </text>
      </g>
    </g>
  );
}

function Item({
  name,
  value,
  color,
  axis,
  label,
  height,
  plotWidth,
  plotHeight,
  index,
  scale,
}: Datum & {
  axis: AxisConfig;
  label: LabelConfig;
  height: number;
  plotWidth: number;
  plotHeight: number;
  index: number;
  scale: ContinuousScale;
}): ReactElement {
  return (<g
    className="princ-item"
    style={{
      transform: `translateY(calc(var(--height, ${height}) * ${index}px))`,
      "--color": color,
    } as CSSProperties}
  >
    <Label {...label} name={name} />
    <Plot
      value={scale(value)}
      width={plotWidth}
      height={plotHeight}
    />
    <g
      style={{
        transform: `translateX(calc(var(--plot-width, ${plotWidth}) * 1px))`,
      }}
    >
      <Axis {...axis} value={value} />
    </g>
  </g>);
}

function Title(
  { name, color = "black", gap = 20, height = 16 }: TitleConfig,
): ReactElement {
  return (
    <g
      className="princ-title"
      style={{
        transform: `translateY(calc(var(--title-gap, ${gap}) * -1px))`,
        fill: `var(--title-color, ${color})`,
        fontSize: `calc(var(--title-height, ${height}) * 1px)`,
      }}
    >
      <g className="princ-align-title">
        <text>{name}</text>
      </g>
    </g>
  );
}

export default function AbsoluteComparison(
  {
    data,
    theme = "jeanluc-red",
    height = 20,
    plot: { height: plotHeight = 10, width = 162 } = {},
    label = {},
    axis = {},
    title = {},
    sort = "desc",
  }: Config,
): ReactElement {
  const max = Math.max(...data.map(({ value }) => value));
  const scale = d3.scaleLinear([0, max], [0, 1]);

  // TODO warn if verbosity and subheights are larger than height

  if (sort === "asc") {
    data.sort((a, b) => a.value - b.value);
  } else if (sort === "desc") {
    data.sort((a, b) => b.value - a.value);
  }

  const itemElems = data.map((datum, i) =>
    <Item
      key={i}
      index={i}
      {...datum}
      axis={axis}
      label={label}
      height={height}
      plotHeight={plotHeight}
      plotWidth={width}
      scale={scale}
    />
  );
  const titleElem = title.name ? <Title {...title} /> : null;

  return (
    <g className={theme}>
      <g
        className="princ-abscomp"
      >
        <g
          style={{
            transform: `translateY(calc(var(--height, ${height}) * -0.5px))`,
          }}
        >
          {titleElem}
        </g>
        {itemElems}
      </g>
    </g>
  );
}

export type AbsoluteComparisonConfig = Config;
