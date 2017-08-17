'use strict';
const lines = require('./lines.js');
const rects = require('./rects.js');

function toLines(curve) {
  return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]]);
}

function distPoint(curve, point) {
  return Math.min(...toLines(curve).map(line => lines.dist.point(line, point)));
}

function distRect(curve, rect) {
  return Math.min(...toLines(curve).map(line => rects.dist.line(rect, line)));
}

function intersectRect(curve, rect, options) {
  return toLines(curve).some(line => rects.intersect.line(rect, line, options));
}

module.exports.to = {
  lines: toLines,
};
module.exports.dist = {
  point: distPoint,
  rect: distRect,
};
module.exports.intersect = {
  rect: intersectRect,
};
