import {
  compile,
  CSSProperties,
  d3,
  JSONSchemaType,
  React,
  ReactElement,
} from "../deps.ts";
import {
  ContinuousScale,
  Curve,
  curveMap,
  curves,
  Format,
  n,
  Point,
  pointMap,
  points,
} from "./types.ts";
import Axis from "./axes.tsx";
import { median } from "../utils.ts";

// x coordinate with either: y coordinate (line); y0 - y1 coordinates (span);
// y0 - y - y1 coordinates (line and span)
type Datum = [number, number] | [number, number, number] | [
  number,
  number,
  number,
  number,
];

function isTwo(data: Datum[]): data is [number, number][] {
  return data.every((d) => d.length === 2);
}

function isThree(data: Datum[]): data is [number, number, number][] {
  return data.every((d) => d.length === 3);
}

function isFour(data: Datum[]): data is [number, number, number, number][] {
  return data.every((d) => d.length === 4);
}

interface EvolutionDatum {
  data: Datum[];
  color?: string;
  label?: string;
  curve?: Curve;
  point?: Point;
}

export interface EvolutionAxis {
  label?: string;
  format?: Format;
  min?: number;
  max?: number;
  ticks?: number[];
}

export interface EvolutionData {
  type: "evolution";
  data: EvolutionDatum[];
  width?: number;
  height?: number;
  theme?: string;
  xaxis?: EvolutionAxis;
  yaxis?: EvolutionAxis;
}

const evolutionSchema: JSONSchemaType<EvolutionData> = {
  type: "object",
  properties: {
    type: { type: "string", const: "evolution" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          data: {
            type: "array",
            minItems: 1,
            oneOf: [
              {
                items: {
                  type: "array",
                  items: [{ type: "number" }, { type: "number" }],
                  minItems: 2,
                  maxItems: 2,
                },
              },
              {
                items: {
                  type: "array",
                  items: [{ type: "number" }, { type: "number" }, {
                    type: "number",
                  }],
                  minItems: 3,
                  maxItems: 3,
                },
              },
              {
                items: {
                  type: "array",
                  items: [{ type: "number" }, { type: "number" }, {
                    type: "number",
                  }, { type: "number" }],
                  minItems: 4,
                  maxItems: 4,
                },
              },
            ],
            // NOTE JSONSchemaType doesn't accurately type check unions
          } as unknown as JSONSchemaType<Datum[]>,
          color: n({ type: "string" }),
          label: n({ type: "string" }),
          curve: n({ type: "string", enum: curves }),
          point: n({ type: "string", enum: points }),
        },
        required: ["data"],
        additionalProperties: false,
      },
      minItems: 1,
    },
    width: n({ type: "number", minimum: 0 }),
    height: n({ type: "number", minimum: 0 }),
    theme: n({ type: "string" }),
    xaxis: n({
      type: "object",
      properties: {
        label: n({ type: "string" }),
        format: n({ type: "string" }),
        min: n({ type: "number" }),
        max: n({ type: "number" }),
        ticks: n({ type: "array", items: { type: "number" } }),
      },
      required: [],
      additionalProperties: false,
    }),
    yaxis: n({
      type: "object",
      properties: {
        label: n({ type: "string" }),
        format: n({ type: "string" }),
        min: n({ type: "number" }),
        max: n({ type: "number" }),
        ticks: n({ type: "array", items: { type: "number" } }),
      },
      required: [],
      additionalProperties: false,
    }),
  },
  required: ["type", "data"],
  additionalProperties: false,
};

const isEvolution = compile(evolutionSchema);

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
  const curveFunc = curveMap[curve];
  const lineFunc = d3.line(
    ([x]) => xscale(x),
    ([, y]) => yscale(y),
  ).curve(curveFunc);
  const pointPath = d3.symbol(pointMap[point])() || undefined;

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
}

export default function Evolution(
  props: Record<string, unknown>,
): ReactElement {
  if (!isEvolution(props)) {
    const messages = (isEvolution.errors || []).map(({ dataPath, message }) =>
      `${dataPath}: ${message}`
    )
      .join("\n");
    throw new Error(`invalid evolution config:\n${messages}`);
  }

  const {
    data,
    width = 162,
    height = 100,
    theme = "mathematica",
    xaxis = {},
    yaxis = {},
  } = props;

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
    <EvoDatum xscale={xscale} yscale={yscale} {...datum} key={i} />
  );

  return (<g className={theme}>
    <g className="princ-evolution">
      <g transform={`translate(0, ${height})`}>
        <Axis type="x" scale={xscale} {...xrest} />
      </g>
      <g>
        <Axis type="y" scale={yscale} {...yrest} />
      </g>
      <g className="princ-evolution-items">
        {itemElems}
      </g>
    </g>
  </g>);
}
