'use strict';
import lines = require('./lines.js');

function containsPoint(rect: Rect, point: Point, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  const [x, y, w, h] = rect;
  return x - tol <= point[0] && point[0] <= x + w + tol && y - tol <= point[1] && point[1] <= y + h + tol;
}

function area(rect: Rect): number {
  return rect[2] * rect[3];
}

function toLines(rect: Rect): Line[] {
  const [x, y, w, h] = rect;
  return [
    [[x, y], [x + w, y]],
    [[x + w, y], [x + w, y + h]],
    [[x + w, y + h], [x, y + h]],
    [[x, y + h], [x, y]],
  ];
}

function toPoly(rect: Rect): Poly {
  const [x, y, w, h] = rect;
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

function intersection(rect: Rect, other: Rect): never {
  throw Error(); // FIXME
}

function containsLine(rect: Rect, line: Line, options?: {}): boolean {
  return line.every(point => containsPoint(rect, point, options))
}

function containsRect(rect: Rect, other: Rect, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  const [x1, y1, w1, h1] = rect;
  const [x2, y2, w2, h2] = other;
  return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
}

function intersectLine(rect: Rect, line: Line, options?: {}): boolean {
  return containsLine(rect, line, options) || toLines(rect).some(other => lines.intersect.line(line, other, options));
}

function intersectRect(rect: Rect, other: Rect, options?: {}): boolean {
  return containsRect(rect, other, options) || containsRect(other, rect, options) || toLines(other).some(line => intersectLine(rect, line, options));
}

function distPoint(rect: Rect, point: Point): number {
  if (containsPoint(rect, point)) {
    return 0;
  } else {
    return Math.min(...toLines(rect).map(line => lines.dist.point(line, point)));
  }
}

/** dist between box and line squared */
function distLine(rect: Rect, line: Line): number {
  const [x, y, w, h] = rect;
  if (toLines(rect).some(other => lines.intersect.line(line, other))) {
    return 0;
  } else {
    return Math.min(
      Math.min(...toPoly(rect).map(point => lines.dist.point(line, point))),
      Math.min(...line.map(point => distPoint(rect, point))),
    );
  }
}

function distRect(rect: Rect, other: Rect): number {
  return Math.min(
    Math.min(...toPoly(rect).map(point => distPoint(other, point))),
    Math.min(...toPoly(other).map(point => distPoint(rect, point))),
  );
}

function equal(rect: Rect, other: Rect, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  return rect.every((di, i) => Math.abs(di - other[i]) <= tol);
}

function randomPoint(rect: Rect): Point {
  const [x, y, w, h] = rect;
  return [
    Math.random() * w + x,
    Math.random() * h + y,
  ]
}

export = {
  equal: equal,
  area: area,
  intersection: intersection,
  dist: {
    point: distPoint,
    line: distLine,
    rect: distRect,
  },
  to: {
    lines: toLines,
    poly: toPoly,
    points: toPoly,
  },
  contains: {
    point: containsPoint,
    line: containsLine,
    rect: containsRect,
  },
  intersect: {
    point: containsPoint,
    line: intersectLine,
    rect: intersectRect,
  },
  random: {
    point: randomPoint,
  },
}
