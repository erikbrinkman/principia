import * as lines from "./lines";
import { Line } from "./lines";
import { Point } from "./points";
import { Poly } from "./polys";

export type Rect = [number, number, number, number];

export function area([, , width, height]: Rect): number {
  return width * height;
}

export function equal(rect: Rect, other: Rect, options: {tol?: number} = {}): boolean {
  const { tol = 0 } = options;
  return rect.every((di, i) => Math.abs(di - other[i]) <= tol);
}

export function intersection(rect: Rect, other: Rect): never {
  throw Error(); // FIXME
}

export namespace contains {
  export function point([x, y, w, h]: Rect, [px, py]: Point, options: {tol?: number} = {}): boolean {
    const { tol = 0 } = options;
    return x - tol <= px && px <= x + w + tol && y - tol <= py && py <= y + h + tol;
  }

  export function line(rect: Rect, line: Line, options: {} = {}): boolean {
    return line.every(point => contains.point(rect, point, options));
  }

  export function rect([x1, y1, w1, h1]: Rect, [x2, y2, w2, h2]: Rect, options: {tol?: number} = {}): boolean {
    const { tol = 0 } = options;
    return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
  }
}



export namespace to {
  export function lines([x, y, w, h]: Rect): Line[] {
    return [
      [[x, y], [x + w, y]],
      [[x + w, y], [x + w, y + h]],
      [[x + w, y + h], [x, y + h]],
      [[x, y + h], [x, y]],
    ];
  }

  export function poly([x, y, w, h]: Rect): Poly {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
  }

  export function points(rect: Rect): Point[] {
    return poly(rect);
  }
}

export namespace dist {
  export function point(rect: Rect, point: Point): number {
    if (contains.point(rect, point)) {
      return 0;
    } else {
      return Math.min(...to.lines(rect).map(line => lines.dist.point(line, point)));
    }
  }

  export function line(rect: Rect, line: Line): number {
    if (to.lines(rect).some(other => lines.intersect.line(line, other))) {
      return 0;
    } else {
      return Math.min(
        Math.min(...to.poly(rect).map(point => lines.dist.point(line, point))),
        Math.min(...line.map(point => dist.point(rect, point))),
      );
    }
  }

  export function rect(rect: Rect, other: Rect): number {
    return Math.min(
      Math.min(...to.poly(rect).map(point => dist.point(other, point))),
      Math.min(...to.poly(other).map(point => dist.point(rect, point))),
    );
  }
}

export namespace intersect {
  // FIXME Change to function
  export const point = contains.point;

  export function line(rect: Rect, line: Line, options: {} = {}): boolean {
    return contains.line(rect, line, options) || to.lines(rect).some(other => lines.intersect.line(line, other, options));
  }

  export  function rect(rect: Rect, other: Rect, options: {} = {}): boolean {
    return contains.rect(rect, other, options) || contains.rect(other, rect, options) || to.lines(other).some(line => intersect.line(rect, line, options));
  }
}

export namespace random {
  export function point([x, y, w, h]: Rect): Point {
    return [
      Math.random() * w + x,
      Math.random() * h + y,
    ];
  }
}
