'use strict';
const points = require('./points.js');
const rects = require('./rects.js');

/** dist between point and line squared */
function distPoint(line, point) {
  // TODO detect if line is degenerate
  const rx = point[0] - line[0][0];
  const ry = point[1] - line[0][1];
  const lx = line[1][0] - line[0][0];
  const ly = line[1][1] - line[0][1];
  const c = (rx * lx + ry * ly) / (lx * lx + ly * ly);
  const u = Math.min(Math.max(0, c), 1);
  return Math.sqrt((rx - u * lx) ** 2 + (ry - u * ly) ** 2);
}

/** find orientation of point relative to line 1 for right, -1 for left */
function orientation(line, point, options) {
  const { tol = 0 } = options || {};
  const [[l1x, l1y], [l2x, l2y]] = line;
  const val = (l2y - l1y) * (point[0] - l2x) - (l2x - l1x) * (point[1] - l2y);
  return Math.abs(val) <= tol ? 0 : Math.sign(val);
}

function intersection(line, other) {
  throw Error(); // FIXME
}

function length(line) {
  return points.dist.point(...line);
}

function rectContainsPoint(line, point, options) {
  return rects.contains.point(toRect(line), point, options);
}

function containsPoint(line, point, options) {
  return orientation(line, point, options) === 0 && rectContainsPoint(line, point, options);
}

/** two lines intersect */
function intersectLine(line, other, options) {
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
}

function toPoly(line, options) {
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
}

function toRect(line) {
  const maxx = Math.max(line[0][0], line[1][0]);
  const minx = Math.min(line[0][0], line[1][0]);
  const maxy = Math.max(line[0][1], line[1][1]);
  const miny = Math.min(line[0][1], line[1][1]);
  return [minx, miny, maxx - minx, maxy - miny];
}

function toPoints(line) {
  return line;
}

function equal(line, other, options) {
  const { tol = 0 } = options || {};
  return (points.equal(line[0], other[0], {tol: tol}) && points.equal(line[1], other[1], {tol: tol}))
    || (points.equal(line[0], other[1], {tol: tol}) && points.equal(line[1], other[0], {tol: tol}));
}

function randomPoint(line) {
  const rand = Math.random();
  return [
    line[0][0] + rand * (line[1][0] - line[0][0]),
    line[0][1] + rand * (line[1][1] - line[0][1]),
  ];
}

module.exports.equal = equal;
module.exports.orientation = orientation;
module.exports.length = length;
module.exports.intersection = intersection;
module.exports.dist = {
  point: distPoint,
};
module.exports.contains = {
  point: containsPoint,
};
module.exports.intersect = {
  point: containsPoint,
  line: intersectLine,
};
module.exports.to = {
  poly: toPoly,
  rect: toRect,
  points: toPoints,
};
module.exports.random = {
  point: randomPoint,
};