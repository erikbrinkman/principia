import { Rect } from "./rects";

export type Point = [number, number];

export function equal(point: Point, other: Point, options: {tol?: number} = {}): boolean {
  const { tol = 0 } = options;
  return dist.point(point, other) <= tol ** 2;
}

export namespace dist {
  export function point([px, py]: Point, [ox, oy]: Point): number {
    return Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);
  }
}

export namespace to {
  export function rect([px, py]: Point): Rect {
    return [px, py, 0, 0];
  }
}
