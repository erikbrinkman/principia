"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dist = {
    point: (point, other) => {
        return Math.sqrt(Math.pow((point[0] - other[0]), 2) + Math.pow((point[1] - other[1]), 2));
    },
};
function equal(point, other, options) {
    const { tol = 0 } = options || {};
    return exports.dist.point(point, other) <= Math.pow(tol, 2);
}
exports.equal = equal;
