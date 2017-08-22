'use strict';
const points = require('./points.js');
const lines = require('./lines.js');
const rects = require('./rects.js');
const turf = require('@turf/helpers');
const difference = require('@turf/difference');
const intersect = require('@turf/intersect');
const union = require('@turf/union');

function area(poly) {
  let area = 0;
  poly.forEach((curr, i) => {
    const next = poly[(i + 1) % poly.length];
    area += (next[0] - curr[0]) * (next[1] + curr[1]);
  });
  return Math.abs(area) / 2;
}

function perimeter(poly) {
  return toLines(poly).reduce((p, l) => p + lines.length(l), 0);
}

function containsPoint(poly, point, options) {
  const linez = toLines(poly);
  const inside = linez.reduce((ins, line) => {
    const orient = lines.orientation(line, point);
    return ((line[0][1] <= point[1] && point[1] < line[1][1] && orient < 0) ||
            (point[1] < line[0][1] && line[1][1] <= point[1] && orient > 0)) ^ ins;
  }, false);
  return inside || linez.some(line => lines.contains.point(line, point, options));
}

function toLines(poly) {
  return poly.map((curr, i) => {
    const next = poly[(i + 1) % poly.length];
    return [curr, next];
  });
}

function toRect(poly) {
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
}

function convertPoly(coords) {
  if (coords.length === 1) {
    return coords[0].slice(0, -1);
  } else {
    return coords.map(poly => ({poly: poly, area: area(poly)}))
      .reduce((a, b) => b.area > a.area ? b : a)
      .poly.slice(0, -1);
  }
}

function wrapTurf(func) {
  return (poly1, poly2) => {
    const t1 = turf.polygon([poly1.concat([poly1[0]])]);
    const t2 = turf.polygon([poly2.concat([poly2[0]])]);
    const res = func(t1, t2);
    if (!res) {
      return [];
    } else if (res.geometry.type === 'Polygon') {
      return [convertPoly(res.geometry.coordinates)];
    } else if (res.geometry.type === 'MultiPolygon') {
      return res.geometry.coordinates.map(coords => convertPoly(coords));
    }
  };
}

function equalOneDirection(poly, other, tol) {
  return poly.some((_, offset) => poly.every((p, i) => points.equal(p, other[(i + offset) % poly.length], {tol: tol})));
}

function equal(poly, other, options) {
  const { tol = 0 } = options || {};
  return poly.length === other.length && (equalOneDirection(poly, other, tol) || equalOneDirection(poly.slice().reverse(), other, tol));
}

function translate(poly, vec) {
  return poly.map(([x, y]) => [x + vec[0], y + vec[1]]);
}

function rotate(poly, angle) {
  return poly.map(([x, y]) => [
    Math.cos(angle) * x - Math.sin(angle) * y,
    Math.sin(angle) * x + Math.sin(angle) * y,
  ]);
}

function randomPoint(poly) {
  const rect = toRect(poly);
  while (true) {
    const point = rects.random.point(rect);
    if (containsPoint(poly, point)) {
      return point;
    }
  }
}

module.exports.equal = equal;
module.exports.perimeter = perimeter;
module.exports.translate = translate;
module.exports.rotate = rotate;
module.exports.union = wrapTurf(union);
module.exports.intersect = wrapTurf(intersect);
module.exports.difference = wrapTurf(difference);
module.exports.area = area;
module.exports.contains = {
  point: containsPoint,
};
module.exports.to = {
  lines: toLines,
  rect: toRect,
};
module.exports.random = {
  point: randomPoint,
};