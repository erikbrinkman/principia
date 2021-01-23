import { d3 } from "../deps.ts";

/** fix for json schema typescript types */
export function n<T>(schema: T): T & { nullable: true } {
  return schema as T & { nullable: true };
}

// Curves
export const curveMap = {
  linear: d3.curveLinear,
  step: d3.curveStep,
  stepBefore: d3.curveStepBefore,
  stepAfter: d3.curveStepAfter,
  basis: d3.curveBasis,
  cardinal: d3.curveCardinal,
  monotone: d3.curveMonotoneX,
  catmullRom: d3.curveCatmullRom,
};
export type Curve = keyof typeof curveMap;
export const curves = Object.keys(curveMap) as Curve[];

// Points
export const pointMap = {
  circle: d3.symbolCircle,
  cross: d3.symbolCross,
  diamond: d3.symbolDiamond,
  square: d3.symbolSquare,
  star: d3.symbolStar,
  triangle: d3.symbolTriangle,
  wye: d3.symbolWye,
};
export type Point = keyof typeof pointMap;
export const points = Object.keys(pointMap) as Point[];

// Scales
export type ContinuousScale = d3.ScaleContinuousNumeric<number, number>;

export const scaleMap = {
  linear: d3.scaleLinear,
  log: d3.scaleLog,
  sqrt: d3.scaleSqrt,
};
export type Scale = keyof typeof scaleMap;
export const scales = Object.keys(scaleMap) as Scale[];

// TODO string template union type of all valid format strings
export type Format = string;

export type Formatter = (n: number) => string;
