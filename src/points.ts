"use strict";

export type Point = [number, number];

export const dist = {
  point: (point: Point, other: Point): number => {
    return Math.sqrt((point[0] - other[0]) ** 2 + (point[1] - other[1]) ** 2);
  },
}

export function equal(point: Point, other: Point, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  return dist.point(point, other) <= tol ** 2;
}
