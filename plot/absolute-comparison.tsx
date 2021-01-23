import { CSSProperties, compile, d3, JSONSchemaType, React, ReactElement } from "../deps.ts";
import { ContinuousScale, Format, Formatter, n } from "./types.ts";

export interface AbsoluteComparisonDatum {
  name: string;
  value: number;
  color?: string;
}

export interface AbsoluteComparisonData {
  type: "absolute comparison";
  data: AbsoluteComparisonDatum[];
  width?: number;
  format?: Format;
  theme?: string;
  sort?: "asc" | "desc";
}

const absoluteComparisonSchema: JSONSchemaType<AbsoluteComparisonData> = {
  type: "object",
  properties: {
    type: { type: "string", const: "absolute comparison" },
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          value: { type: "number", minimum: 0 },
          color: n({ type: "string" }),
        },
        required: ["name", "value"],
        additionalProperties: false,
      },
      minItems: 1,
    },
    width: n({ type: "number", minimum: 0 }),
    format: n({ type: "string" }),
    theme: n({ type: "string" }),
    sort: n({ type: "string", enum: ["asc", "desc"] }),
  },
  required: ["type", "data"],
  additionalProperties: false,
};

const isAbsoluteComparison = compile(absoluteComparisonSchema);

function AbsoluteComparisonItem({
  name,
  value,
  color,
  scale,
  formatter,
}: AbsoluteComparisonDatum & {
  scale: ContinuousScale;
  formatter: Formatter;
}): ReactElement {
  const width = Math.max(...scale.range());

  return (<g
    className="princ-item princ-item-abscomp"
    style={{ "--color": color } as CSSProperties}
  >
    <g className="princ-label">
      <g className="princ-align-label">
        <g className="princ-autoalign-label">
          <text textAnchor="end" alignmentBaseline="central">{name}</text>
        </g>
      </g>
    </g>
    <rect className="princ-comparison" width={scale(value)} />
    <g className="princ-value">
      <g className="princ-align-value">
        <g className="princ-autoalign-value">
          <text alignmentBaseline="central" x={width}>
            {formatter(value)}
          </text>
        </g>
      </g>
    </g>
  </g>);
}

export default function AbsoluteComparison(
  props: Record<string, unknown>,
): ReactElement {
  if (!isAbsoluteComparison(props)) {
    const messages = (isAbsoluteComparison.errors || []).map((
      { dataPath, message },
    ) => `${dataPath}: ${message}`)
      .join("\n");
    throw new Error(`invalid absolute comparison config:\n${messages}`);
  }
  const {
    data,
    theme = "jeanluc-red",
    width = 162,
    format = "",
    sort,
  } = props;
  const formatter = d3.format(format);
  const max = Math.max(...data.map(({ value }) => value));
  const scale = d3.scaleLinear([0, max], [0, width]);

  if (sort === "asc") {
    data.sort((a, b) => a.value - b.value);
  } else if (sort === "desc") {
    data.sort((a, b) => b.value - a.value);
  }

  const itemElems = data.map((datum, i) =>
    <g style={{ transform: `translate(0, ${i}em)` }}>
      <AbsoluteComparisonItem
        key={i}
        {...datum}
        formatter={formatter}
        scale={scale}
      />
    </g>
  );

  return (<g className={theme}><g className="princ-abscomp">{itemElems}</g>
  </g>);
}
