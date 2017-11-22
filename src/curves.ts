"use strict";
import * as lines from "./lines";
import * as rects from "./rects";

export const to = {
  lines: (curve: Curve): Line[] => {
    return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]] as Line);
  },
}

export const dist = {
  point: (curve: Curve, point: Point): number => {
    return Math.min(...to.lines(curve).map(line => lines.dist.point(line, point)));
  },

  rect: (curve: Curve, rect: Rect): number => {
    return Math.min(...to.lines(curve).map(line => rects.dist.line(rect, line)));
  },
}

export const intersect = {
  rect: (curve: Curve, rect: Rect, options?: {tol?: number}): boolean => {
    return to.lines(curve).some(line => rects.intersect.line(rect, line, options));
  },
}
