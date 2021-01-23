import { d3, React, ReactElement } from "../deps.ts";
import { ContinuousScale, Format, Formatter } from "./types.ts";

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
        <g className="princ-autoalign-tick">
          <text
            alignmentBaseline={type === "x" ? "hanging" : "middle"}
            textAnchor={type === "x" ? "middle" : "end"}
          >
            {formatter(tick)}
          </text>
        </g>
      </g>
    </g>
  </g>);
}

function Label(
  { type, label, mid }: { type: "x" | "y"; label: string; mid: number },
): ReactElement {
  return (<g className="princ-label">
    <g className="princ-align-label">
      <g className="princ-autoalign-label">
        <text
          alignmentBaseline={type === "x" ? "hanging" : "baseline"}
          textAnchor={type === "x" ? "middle" : "start"}
          x={type === "x" ? mid : 0}
        >
          {label}
        </text>
      </g>
    </g>
  </g>);
}

export default function Axis({
  type,
  scale,
  format = "",
  ticks = [],
  label,
}: {
  type: "x" | "y";
  scale: ContinuousScale;
  format?: Format;
  ticks?: number[];
  label?: string;
}): ReactElement {
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
}
