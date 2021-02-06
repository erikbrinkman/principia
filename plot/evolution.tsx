import { CSSProperties, JTDSchemaType, React, ReactElement } from "./deps.ts";
import {
  ContinuousScale,
  Curve,
  curveMap,
  curves,
  Formatter,
  Point,
  pointMap,
  points,
} from "./config.ts";
// FIXME move to plot if only necessary here
import { median } from "../utils.ts";

// x, y
function isTwo(data: number[][]): data is [number, number][] {
  return data.every((d) => d.length === 2);
}

// x, y0 - y1
function isThree(data: number[][]): data is [number, number, number][] {
  return data.every((d) => d.length === 3);
}

// x, y0, y, y1
function isFour(data: number[][]): data is [number, number, number, number][] {
  return data.every((d) => d.length === 4);
}

interface EvolutionDatum {
  data: number[][];
  color?: string;
  label?: string;
  curve?: Curve;
  point?: Point;
}

const evolutionDatumSchema: JTDSchemaType<EvolutionDatum> = {
  properties: {
    data: {
      elements: { elements: { type: "float64" } },
    },
  },
  optionalProperties: {
    color: { type: "string" },
    label: { type: "string" },
    curve: { enum: curves },
    point: { enum: points },
  },
};

export interface EvolutionAxis {
  label?: string;
  format?: string;
  min?: number;
  max?: number;
  ticks?: number[];
}

const evolutionAxisSchema: JTDSchemaType<EvolutionAxis> = {
  optionalProperties: {
    label: { type: "string" },
    format: { type: "string" },
    min: { type: "float64" },
    max: { type: "float64" },
    ticks: { elements: { type: "float64" } },
  },
};

export interface EvolutionData {
  data: EvolutionDatum[];
  width?: number;
  height?: number;
  theme?: string;
  xaxis?: EvolutionAxis;
  yaxis?: EvolutionAxis;
}

export const evolutionSchema: JTDSchemaType<EvolutionData> = {
  properties: {
    data: {
      elements: evolutionDatumSchema,
    },
  },
  optionalProperties: {
    width: { type: "float64" },
    height: { type: "float64" },
    theme: { type: "string" },
    xaxis: evolutionAxisSchema,
    yaxis: evolutionAxisSchema,
  },
};

// FIXME remove autoalign in favor of just align, make alignment done via css / parameters

/**
 * gets unique sorted ticks based on formatter
 *
 * Picks either the min, or max value, or the mean if neither.
 */
function getRenderedTicks(
  min: number,
  max: number,
  ticks: number[],
  formatter: Formatter,
): number[] {
  const unique = new Map<string, Set<number>>();
  for (const num of ticks.slice().concat([min, max])) {
    const form = formatter(num);
    const nums = unique.get(form);
    if (nums === undefined) {
      unique.set(form, new Set<number>([num]));
    } else {
      nums.add(num);
    }
  }
  const result = [];
  for (const nums of unique.values()) {
    if (nums.has(min)) {
      result.push(min);
    } else if (nums.has(max)) {
      result.push(max);
    } else {
      result.push([...nums].reduce((a, v, i) => a + (v - a) / (i + 1), 0));
    }
  }
  result.sort((a, b) => a - b);
  return result;
}

function Bar(
  { type, min, max }: { type: "x" | "y"; min: number; max: number },
): ReactElement {
  if (type === "x") {
    return <line x1={min} x2={max} className="princ-axis-bar" />;
  } else {
    return <line y1={min} y2={max} className="princ-axis-bar" />;
  }
}

function Tick(
  { type, tick, scale, formatter }: {
    type: "x" | "y";
    tick: number;
    scale: ContinuousScale;
    formatter: Formatter;
  },
): ReactElement {
  const transform = type === "x"
    ? `translate(${scale(tick)}, 0)`
    : `translate(0, ${scale(tick)})`;
  const mark = type === "x"
    ? <line y2={-1} className="princ-tick-mark" />
    : <line x2={1} className="princ-tick-mark" />;
  return (<g
    className="princ-tick"
    transform={transform}
  >
    {mark}
    <g className="princ-tick-label">
      <g className="princ-align-tick">
        <text
          alignmentBaseline={type === "x" ? "hanging" : "middle"}
          textAnchor={type === "x" ? "middle" : "end"}
        >
          {formatter(tick)}
        </text>
      </g>
    </g>
  </g>);
}

function Label(
  { type, label, mid }: { type: "x" | "y"; label: string; mid: number },
): ReactElement {
  return (<g className="princ-label">
    <g className="princ-align-label">
      <text
        alignmentBaseline={type === "x" ? "hanging" : "baseline"}
        textAnchor={type === "x" ? "middle" : "start"}
        x={type === "x" ? mid : 0}
      >
        {label}
      </text>
    </g>
  </g>);
}

function Axis({
  type,
  scale,
  format = "",
  ticks = [],
  label,
}: {
  type: "x" | "y";
  scale: ContinuousScale;
  format?: string;
  ticks?: number[];
  label?: string;
}): ReactElement {
  /*
  const min = Math.min(...scale.domain());
  const max = Math.max(...scale.domain());
  const formatter = d3.format(format);
  const ticksRendered = getRenderedTicks(min, max, ticks, formatter);
  const tickElems = ticksRendered.map((tick, i) =>
    <Tick key={i} type={type} tick={tick} scale={scale} formatter={formatter} />
  );
  const rmin = Math.min(...scale.range());
  const rmax = Math.max(...scale.range());
  const labelElem = label
    ? <Label type={type} label={label} mid={(rmin + rmax) / 2} />
    : null;
  return (<g className={`princ-axis princ-${type}axis`}>
    <g className="princ-align-axis">
      <Bar type={type} min={rmin} max={rmax} />
      {tickElems}
      {labelElem}
    </g>
  </g>);
   */
  return <>/</>;
}

function EvoDatum(
  {
    data,
    color,
    label,
    curve = "catmullRom",
    point = "circle",
    xscale,
    yscale,
  }: EvolutionDatum & { xscale: ContinuousScale; yscale: ContinuousScale },
): ReactElement {
  /*
  const curveFunc = curveMap[curve];
  const lineFunc = d3.line(
    ([x]) => xscale(x),
    ([, y]) => yscale(y),
  ).curve(curveFunc);
  const pointPath = d3.symbol(pointMap[point], 1)() || undefined;

  let spanPath, points;
  if (isTwo(data)) {
    spanPath = null;
    points = data;
  } else if (isThree(data)) {
    spanPath = d3.area<[number, number, number]>(
      ([x]) => xscale(x),
      ([, y0]) => yscale(y0),
      (([, , y1]) => yscale(y1)),
    ).curve(curveFunc)(data);
    points = null;
  } else if (isFour(data)) {
    spanPath = d3.area<[number, number, number, number]>(
      ([x]) => xscale(x),
      ([, y0]) => yscale(y0),
      (([, , , y1]) => yscale(y1)),
    ).curve(curveFunc)(data);
    points = data.map(([x, , y]) => [x, y] as [number, number]);
  } else {
    throw new Error("unexpected data format");
  }
  const spanElem = spanPath && <g className="princ-span">
    <path d={spanPath} />
  </g>;
  const lineElem = points && <g className="princ-line">
    <path d={lineFunc(points) || undefined} />
  </g>;
  const pointElems = points && points.map((
    [x, y],
    i,
  ) =>
    <g
      key={i}
      transform={`translate(${xscale(x)}, ${yscale(y)})`}
    >
      <g
        className="princ-point"
      >
        <path d={pointPath} />
      </g>
    </g>
  );
  const pointsElem = pointElems && <g className="princ-points">{pointElems}</g>;

  const xlabel = Math.max(...xscale.range());
  const [, ylabel] = (data as number[][]).map((
    [x, ...ys],
  ) => [xscale(x), yscale(median(ys))]).reduce((
    mx,
    nx,
  ) => mx[0] > nx[0] ? mx : nx);

  const labelElem = label && (<g className="princ-label">
    <g className="princ-align-label">
      <g className="princ-autoalign-label">
        <text
          alignmentBaseline="middle"
          textAnchor="start"
          x={xlabel}
          y={ylabel}
        >
          {label}
        </text>
      </g>
    </g>
  </g>);
  return <g
    className="princ-item"
    style={{ "--color": color } as CSSProperties}
  >
    {spanElem}
    {lineElem}
    {pointsElem}
    {labelElem}
  </g>;
  */
  return <></>;
}

export default function Evolution(
  {
    data,
    width = 162,
    height = 100,
    xaxis = {},
    yaxis = {},
    theme = "mathematica",
  }: EvolutionData,
): ReactElement {
  /*
  const {
    min: xpmin = Number.POSITIVE_INFINITY,
    max: xpmax = Number.NEGATIVE_INFINITY,
    ...xrest
  } = xaxis;
  const xmin = Math.min(
    Math.min(
      ...data.map(({ data }) => Math.min(...data.map(([x]) => x))),
    ),
    xpmin,
  );
  const xmax = Math.max(
    Math.max(
      ...data.map(({ data }) => Math.max(...data.map(([x]) => x))),
    ),
    xpmax,
  );

  const {
    min: ypmin = Number.POSITIVE_INFINITY,
    max: ypmax = Number.NEGATIVE_INFINITY,
    ...yrest
  } = yaxis;
  const ymin = Math.min(
    Math.min(
      ...data.map(({ data }) =>
        Math.min(...data.map(([, ...ys]) => Math.min(...ys)))
      ),
    ),
    ypmin,
  );
  const ymax = Math.max(
    Math.max(
      ...data.map(({ data }) =>
        Math.max(...data.map(([, ...ys]) => Math.max(...ys)))
      ),
    ),
    ypmax,
  );

  const xscale = d3.scaleLinear([xmin, xmax], [0, width]);
  const yscale = d3.scaleLinear([ymin, ymax], [height, 0]);

  const itemElems = data.map((datum, i) =>
    <EvoDatum key={i} xscale={xscale} yscale={yscale} {...datum} />
  );
  const style = genStyle({}, extraStyle, customThemes);

  return (
    <g className={theme}>
      <g className="princ-evolution">
        <g transform={`translate(0, ${height})`}>
          <Axis type="x" scale={xscale} {...xrest} />
        </g>
        <g>
          <Axis type="y" scale={yscale} {...yrest} />
        </g>
        <g>
          {itemElems}
        </g>
      </g>
    </g>);
   */
  return <></>;
}
