import * as lines from "./lines";
import * as rects from "./rects";
import { Line } from "./lines";
import { Point } from "./points";
import { Rect } from "./rects";

export type Curve = Point[];

export namespace to {
  export function lines(curve: Curve): Line[] {
    return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]] as Line);
  }
}

export namespace dist {
  export function point(curve: Curve, point: Point): number {
    return Math.min(...to.lines(curve).map(line => lines.dist.point(line, point)));
  }

  export function rect(curve: Curve, rect: Rect): number {
    return Math.min(...to.lines(curve).map(line => rects.dist.line(rect, line)));
  }
}

export namespace intersect {
  export function rect(curve: Curve, rect: Rect, options: {tol?: number} = {}): boolean {
    return to.lines(curve).some(line => rects.intersect.line(rect, line, options));
  }
}
