export type Point = [number, number];

export const dist = {
  point: ([px, py]: Point, [ox, oy]: Point): number => {
    return Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);
  },
};

export function equal(point: Point, other: Point, options: {tol?: number} = {}): boolean {
  const { tol = 0 } = options;
  return dist.point(point, other) <= tol ** 2;
}
