'use strict';

function distPoint(point: Point, other: Point): number {
  return Math.sqrt((point[0] - other[0]) ** 2 + (point[1] - other[1]) ** 2);
}

function equal(point: Point, other: Point, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  return distPoint(point, other) <= tol ** 2;
}

export = {
  equal: equal,
  dist: {
    point: distPoint,
  },
};
