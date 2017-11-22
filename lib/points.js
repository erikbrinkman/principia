'use strict';
function distPoint(point, other) {
    return Math.sqrt(Math.pow((point[0] - other[0]), 2) + Math.pow((point[1] - other[1]), 2));
}
function equal(point, other, options) {
    const { tol = 0 } = options || {};
    return distPoint(point, other) <= Math.pow(tol, 2);
}
module.exports = {
    equal: equal,
    dist: {
        point: distPoint,
    },
};
