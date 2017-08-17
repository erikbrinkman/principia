'use strict';

function equal(point, other, options) {
  const { tol = 0 } = options || {};
  return point.every((c, i) => Math.abs(c - other[i]) <= tol);
}

function distPoint(point, other) {
  return Math.sqrt((point[0] - other[0]) ** 2 + (point[1] - other[1]) ** 2);
}

module.exports.equal = equal;
module.exports.dist = {
  point: distPoint,
};
