"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function equal(point, other, options = {}) {
    const { tol = 0 } = options;
    return dist.point(point, other) <= Math.pow(tol, 2);
}
exports.equal = equal;
var dist;
(function (dist) {
    function point([px, py], [ox, oy]) {
        return Math.sqrt(Math.pow((px - ox), 2) + Math.pow((py - oy), 2));
    }
    dist.point = point;
})(dist = exports.dist || (exports.dist = {}));
var to;
(function (to) {
    function rect([px, py]) {
        return [px, py, 0, 0];
    }
    to.rect = rect;
})(to = exports.to || (exports.to = {}));
