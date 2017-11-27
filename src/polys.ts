'use strict';
import * as points from "./points";
import * as lines from "./lines";
import * as rects from "./rects";
import * as turf from "@turf/helpers";
import * as tdifference from "@turf/difference";
import * as tintersect from "@turf/intersect";
import * as tunion from "@turf/union";
import { Point } from "./points";
import { Line } from "./lines";
import { Rect } from "./rects";

export type Poly = Point[];

// FIXME Remove turf

export function area(poly: Poly): number {
  let area = 0;
  poly.forEach((curr, i) => {
    const next = poly[(i + 1) % poly.length];
    area += (next[0] - curr[0]) * (next[1] + curr[1]);
  });
  return Math.abs(area) / 2;
}

export function perimeter(poly: Poly): number {
  return to.lines(poly).reduce((p, l) => p + lines.length(l), 0);
}

function equalOneDirection(poly: Poly, other: Poly, tol: number): boolean {
  return poly.some((_, offset) => poly.every((p, i) => points.equal(p, other[(i + offset) % poly.length], {tol: tol})));
}

export function equal(poly: Poly, other: Poly, options?: {tol?: number}): boolean {
  const { tol = 0 } = options || {};
  return poly.length === other.length && (equalOneDirection(poly, other, tol) || equalOneDirection(poly.slice().reverse(), other, tol));
}

export function translate(poly: Poly, vec: Point): Poly {
  return poly.map(([x, y]) => [x + vec[0], y + vec[1]] as Point);
}

export function rotate(poly: Poly, angle: number): Poly {
  return poly.map(([x, y]) => [
    Math.cos(angle) * x - Math.sin(angle) * y,
    Math.sin(angle) * x + Math.sin(angle) * y,
  ] as Point);
}

export const to = {
  lines: (poly: Poly): Line[] => {
    return poly.map((curr, i) => {
      const next = poly[(i + 1) % poly.length];
      return [curr, next] as Line;
    });
  },

  rect: (poly: Poly): Rect => {
    let minx = Infinity;
    let miny = Infinity;
    let maxx = -Infinity;
    let maxy = -Infinity;
    poly.forEach(([x, y]) => {
      minx = Math.min(minx, x);
      miny = Math.min(miny, y);
      maxx = Math.max(maxx, x);
      maxy = Math.max(maxy, y);
    });
    return [minx, miny, maxx - minx, maxy - miny];
  },
}

export const contains = {
  point: (poly: Poly, point: Point, options?: {tol?: number}): boolean => {
    const linez = to.lines(poly);
    const inside = linez.reduce((ins, line) => {
      const orient = lines.orientation(line, point);
      return (((line[0][1] <= point[1] && point[1] < line[1][1] && orient < 0) ||
        (point[1] < line[0][1] && line[1][1] <= point[1] && orient > 0))) !== ins;
    }, false);
    return inside || linez.some(line => lines.contains.point(line, point, options));
  },
}

export const random = {
  point: (poly: Poly): Point => {
    const rect = to.rect(poly);
    while (true) {
      const point = rects.random.point(rect);
      if (contains.point(poly, point)) {
        return point;
      }
    }
  },
}

function convertPoly(coords: Point[][]): Poly {
  if (coords.length === 1) {
    return coords[0].slice(0, -1);
  } else {
    return coords.map(poly => ({poly: poly, area: area(poly)}))
      .reduce((a, b) => b.area > a.area ? b : a)
      .poly.slice(0, -1);
  }
}

function wrapTurf(func: any): (a: Poly, b: Poly) => Poly[] {
  return (poly1: Poly, poly2: Poly) => {
    const t1 = turf.polygon([poly1.concat([poly1[0]])]);
    const t2 = turf.polygon([poly2.concat([poly2[0]])]);
    const res = func(t1, t2);
    if (!res) {
      return [];
    } else if (res.geometry.type === 'Polygon') {
      return [convertPoly(res.geometry.coordinates)];
    } else if (res.geometry.type === 'MultiPolygon') {
      return res.geometry.coordinates.map((coords: Point[][]) => convertPoly(coords));
    }
  };
}

export const union = wrapTurf(tunion);
export const intersect = wrapTurf(tintersect);
export const difference = wrapTurf(tdifference);
