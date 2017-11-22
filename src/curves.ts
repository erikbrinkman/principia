'use strict';
import lines = require('./lines.js');
import rects = require('./rects.js');

function toLines(curve: Curve): Line[] {
  return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]] as Line);
}

function distPoint(curve: Curve, point: Point): number {
  return Math.min(...toLines(curve).map(line => lines.dist.point(line, point)));
}

function distRect(curve: Curve, rect: Rect): number {
  return Math.min(...toLines(curve).map(line => rects.dist.line(rect, line)));
}

function intersectRect(curve: Curve, rect: Rect, options?: {tol?: number}): boolean {
  return toLines(curve).some(line => rects.intersect.line(rect, line, options));
}

export = {
  to: {
    lines: toLines,
  },
  dist: {
    point: distPoint,
    rect: distRect,
  },
  intersect: {
    rect: intersectRect,
  },
}
