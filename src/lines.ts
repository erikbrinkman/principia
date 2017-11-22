"use strict";
import * as points from "./points";
import * as rects from "./rects";

// XXX Helper function if point is in rectangle defined by line
function rectContainsPoint(line: Line, point: Point, options?: {}): boolean {
  return rects.contains.point(to.rect(line), point, options);
}

/** find orientation of point relative to line 1 for right, -1 for left */
export function orientation(line: Line, point: Point, options?: {tol?: number}): number {
  const { tol = 0 } = options || {};
  const [[l1x, l1y], [l2x, l2y]] = line;
  const val = (l2y - l1y) * (point[0] - l2x) - (l2x - l1x) * (point[1] - l2y);
  return Math.abs(val) <= tol ? 0 : Math.sign(val);
}

export function intersection(line: Line, other: Line): never {
  throw Error(); // FIXME
}

// FIXME destructure in argument
export function length(line: Line): number {
  return points.dist.point(line[0], line[1]);
}

export function equal(line: Line, other: Line, options?: {tol?: number}): boolean {
  return (points.equal(line[0], other[0], options) && points.equal(line[1], other[1], options))
    || (points.equal(line[0], other[1], options) && points.equal(line[1], other[0], options));
}

export const contains = {
  point: (line: Line, point: Point, options?: {tol?: number}): boolean => {
    return orientation(line, point, options) === 0 && rectContainsPoint(line, point, options);
  },
}

export const dist = {
  point: (line: Line, point: Point): number => {
    // TODO detect if line is degenerate
    const rx = point[0] - line[0][0];
    const ry = point[1] - line[0][1];
    const lx = line[1][0] - line[0][0];
    const ly = line[1][1] - line[0][1];
    const c = (rx * lx + ry * ly) / (lx * lx + ly * ly);
    const u = Math.min(Math.max(0, c), 1);
    return Math.sqrt((rx - u * lx) ** 2 + (ry - u * ly) ** 2);
  },
}

export const intersect = {
  point: contains.point,

  line: (line: Line, other: Line, options?: {tol?: number}): boolean => {
    // Find the four orientations
    const o1 = orientation(line, other[0], options);
    const o2 = orientation(line, other[1], options);
    const o3 = orientation(other, line[0], options);
    const o4 = orientation(other, line[1], options);

    // General case
    return (o1 !== o2 && o3 !== o4)
    // Special co-linearity cases
      || (o1 === 0 && rectContainsPoint(line, other[0], options))
      || (o2 === 0 && rectContainsPoint(line, other[1], options))
      || (o3 === 0 && rectContainsPoint(other, line[0], options))
      || (o4 === 0 && rectContainsPoint(other, line[1], options));
  },
}

export const to = {
  // FIXME Change cap to enum?
  poly: (line: Line, options?: {cap?: string, width?:number}): Poly => {
    const { cap = 'butt', width = 1 } = options || {};
    let vx = line[1][0] - line[0][0];
    let vy = line[1][1] - line[0][1];
    const mag = Math.sqrt(vx ** 2 + vy ** 2) / width;
    vx /= mag;
    vy /= mag;
    switch (cap) {
      case 'butt':
        return [
          [line[0][0] - vy, line[0][1] + vx],
          [line[0][0] + vy, line[0][1] - vx],
          [line[1][0] + vy, line[1][1] - vx],
          [line[1][0] - vy, line[1][1] + vx],
        ];
      case 'square':
        return [
          [line[0][0] - vx - vy, line[0][1] - vy + vx],
          [line[0][0] - vx + vy, line[0][1] - vy - vx],
          [line[1][0] + vx + vy, line[1][1] + vy - vx],
          [line[1][0] + vx - vy, line[1][1] + vy + vx],
        ];
      case 'angle':
        return [
          [line[0][0] - vy, line[0][1] + vx],
          [line[0][0] - vx, line[0][1] - vy],
          [line[0][0] + vy, line[0][1] - vx],
          [line[1][0] + vy, line[1][1] - vx],
          [line[1][0] + vx, line[1][1] + vy],
          [line[1][0] - vy, line[1][1] + vx],
        ];
      default:
        throw Error(`unknown cap: "${cap}"`);
    }
  },

  rect: (line: Line): Rect => {
    const maxx = Math.max(line[0][0], line[1][0]);
    const minx = Math.min(line[0][0], line[1][0]);
    const maxy = Math.max(line[0][1], line[1][1]);
    const miny = Math.min(line[0][1], line[1][1]);
    return [minx, miny, maxx - minx, maxy - miny];
  },

  points: (line: Line): Point[] => {
    return line;
  },
}

export const random = {
  point: (line: Line): Point => {
    const rand = Math.random();
    return [
      line[0][0] + rand * (line[1][0] - line[0][0]),
      line[0][1] + rand * (line[1][1] - line[0][1]),
    ];
  },
}