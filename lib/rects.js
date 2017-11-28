"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lines = require("./lines");
function area([, , width, height]) {
    return width * height;
}
exports.area = area;
function equal(rect, other, options = {}) {
    const { tol = 0 } = options;
    return rect.every((di, i) => Math.abs(di - other[i]) <= tol);
}
exports.equal = equal;
function intersection(_rect, _other) {
    throw Error(); // FIXME
}
exports.intersection = intersection;
var contains;
(function (contains) {
    function point([x, y, w, h], [px, py], options = {}) {
        const { tol = 0 } = options;
        return x - tol <= px && px <= x + w + tol && y - tol <= py && py <= y + h + tol;
    }
    contains.point = point;
    function line(rect, line, options = {}) {
        return line.every(point => contains.point(rect, point, options));
    }
    contains.line = line;
    function rect([x1, y1, w1, h1], [x2, y2, w2, h2], options = {}) {
        const { tol = 0 } = options;
        return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
    }
    contains.rect = rect;
})(contains = exports.contains || (exports.contains = {}));
var to;
(function (to) {
    function lines([x, y, w, h]) {
        return [
            [[x, y], [x + w, y]],
            [[x + w, y], [x + w, y + h]],
            [[x + w, y + h], [x, y + h]],
            [[x, y + h], [x, y]],
        ];
    }
    to.lines = lines;
    function poly([x, y, w, h]) {
        return [
            [x, y],
            [x + w, y],
            [x + w, y + h],
            [x, y + h],
        ];
    }
    to.poly = poly;
    function points(rect) {
        return poly(rect);
    }
    to.points = points;
})(to = exports.to || (exports.to = {}));
var dist;
(function (dist) {
    function point(rect, point) {
        if (contains.point(rect, point)) {
            return 0;
        }
        else {
            return Math.min(...to.lines(rect).map(line => lines.dist.point(line, point)));
        }
    }
    dist.point = point;
    function line(rect, line) {
        if (to.lines(rect).some(other => lines.intersect.line(line, other))) {
            return 0;
        }
        else {
            return Math.min(Math.min(...to.poly(rect).map(point => lines.dist.point(line, point))), Math.min(...line.map(point => dist.point(rect, point))));
        }
    }
    dist.line = line;
    function rect(rect, other) {
        return Math.min(Math.min(...to.poly(rect).map(point => dist.point(other, point))), Math.min(...to.poly(other).map(point => dist.point(rect, point))));
    }
    dist.rect = rect;
})(dist = exports.dist || (exports.dist = {}));
var intersect;
(function (intersect) {
    function point(rect, point, options = {}) {
        return contains.point(rect, point, options);
    }
    intersect.point = point;
    function line(rect, line, options = {}) {
        return contains.line(rect, line, options) || to.lines(rect).some(other => lines.intersect.line(line, other, options));
    }
    intersect.line = line;
    function rect(rect, other, options = {}) {
        return contains.rect(rect, other, options) || contains.rect(other, rect, options) || to.lines(other).some(line => intersect.line(rect, line, options));
    }
    intersect.rect = rect;
})(intersect = exports.intersect || (exports.intersect = {}));
var random;
(function (random) {
    function point([x, y, w, h]) {
        return [
            Math.random() * w + x,
            Math.random() * h + y,
        ];
    }
    random.point = point;
})(random = exports.random || (exports.random = {}));
