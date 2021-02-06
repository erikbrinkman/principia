import { d3scale, d3shape } from "./deps.ts";

// curves
export const curveMap = {
  linear: d3shape.curveLinear,
  step: d3shape.curveStep,
  stepBefore: d3shape.curveStepBefore,
  stepAfter: d3shape.curveStepAfter,
  basis: d3shape.curveBasis,
  cardinal: d3shape.curveCardinal,
  monotone: d3shape.curveMonotoneX,
  catmullRom: d3shape.curveCatmullRom,
} as const;
export type Curve = keyof typeof curveMap;
export const curves = Object.keys(curveMap) as Curve[];

// points
export const pointMap = {
  circle: d3shape.symbolCircle,
  cross: d3shape.symbolCross,
  diamond: d3shape.symbolDiamond,
  square: d3shape.symbolSquare,
  star: d3shape.symbolStar,
  triangle: d3shape.symbolTriangle,
  wye: d3shape.symbolWye,
} as const;
export type Point = keyof typeof pointMap;
export const points = Object.keys(pointMap) as Point[];

// scales
export type ContinuousScale = d3scale.ScaleContinuousNumeric<number, number>;

export const scaleMap = {
  linear: d3scale.scaleLinear,
  log: d3scale.scaleLog,
  sqrt: d3scale.scaleSqrt,
};
export type Scale = keyof typeof scaleMap;
export const scales = Object.keys(scaleMap) as Scale[];

// formatter
export type Formatter = (n: number) => string;
