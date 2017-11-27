import * as lines from "./lines";
import { Line } from "./lines";
import { Point } from "./points";
import { Poly } from "./polys";

export type Rect = [number, number, number, number];

export function area(rect: Rect): number {
  return rect[2] * rect[3];
}

export function equal(rect: Rect, other: Rect, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  return rect.every((di, i) => Math.abs(di - other[i]) <= tol);
}

export function intersection(rect: Rect, other: Rect): never {
  throw Error(); // FIXME
}

export const contains = {
  point: (rect: Rect, point: Point, options?: {tol?: number}): boolean => {
    const { tol = 0 } = options || {};
    const [x, y, w, h] = rect;
    return x - tol <= point[0] && point[0] <= x + w + tol && y - tol <= point[1] && point[1] <= y + h + tol;
  },

  line: (rect: Rect, line: Line, options?: {}): boolean => {
    return line.every(point => contains.point(rect, point, options));
  },

  rect: (rect: Rect, other: Rect, options?: {tol?: number}): boolean => {
    const { tol = 0 } = options || {};
    const [x1, y1, w1, h1] = rect;
    const [x2, y2, w2, h2] = other;
    return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
  },
};

function toPoly(rect: Rect): Poly {
  const [x, y, w, h] = rect;
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}


export const to = {
  lines: (rect: Rect): Line[] => {
    const [x, y, w, h] = rect;
    return [
      [[x, y], [x + w, y]],
      [[x + w, y], [x + w, y + h]],
      [[x + w, y + h], [x, y + h]],
      [[x, y + h], [x, y]],
    ];
  },

  poly: toPoly,
  points: toPoly,
};

export const dist = {
  point: (rect: Rect, point: Point): number => {
    if (contains.point(rect, point)) {
      return 0;
    } else {
      return Math.min(...to.lines(rect).map(line => lines.dist.point(line, point)));
    }
  },

  line: (rect: Rect, line: Line): number => {
    const [x, y, w, h] = rect;
    if (to.lines(rect).some(other => lines.intersect.line(line, other))) {
      return 0;
    } else {
      return Math.min(
        Math.min(...to.poly(rect).map(point => lines.dist.point(line, point))),
        Math.min(...line.map(point => dist.point(rect, point))),
      );
    }
  },

  rect: (rect: Rect, other: Rect): number => {
    return Math.min(
      Math.min(...to.poly(rect).map(point => dist.point(other, point))),
      Math.min(...to.poly(other).map(point => dist.point(rect, point))),
    );
  },
};

export const intersect = {
  point: contains.point,

  line: (rect: Rect, line: Line, options?: {}): boolean => {
    return contains.line(rect, line, options) || to.lines(rect).some(other => lines.intersect.line(line, other, options));
  },

  rect: (rect: Rect, other: Rect, options?: {}): boolean => {
    return contains.rect(rect, other, options) || contains.rect(other, rect, options) || to.lines(other).some(line => intersect.line(rect, line, options));
  },
};

export const random = {
  point: (rect: Rect): Point => {
    const [x, y, w, h] = rect;
    return [
      Math.random() * w + x,
      Math.random() * h + y,
    ];
  },
};
