"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dist = {
    point: ([px, py], [ox, oy]) => {
        return Math.sqrt(Math.pow((px - ox), 2) + Math.pow((py - oy), 2));
    },
};
function equal(point, other, options = {}) {
    const { tol = 0 } = options;
    return exports.dist.point(point, other) <= Math.pow(tol, 2);
}
exports.equal = equal;
