"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lines = require("./lines");
function area(rect) {
    return rect[2] * rect[3];
}
exports.area = area;
function equal(rect, other, options) {
    const { tol = 0 } = options || {};
    return rect.every((di, i) => Math.abs(di - other[i]) <= tol);
}
exports.equal = equal;
function intersection(rect, other) {
    throw Error(); // FIXME
}
exports.intersection = intersection;
exports.contains = {
    point: (rect, point, options) => {
        const { tol = 0 } = options || {};
        const [x, y, w, h] = rect;
        return x - tol <= point[0] && point[0] <= x + w + tol && y - tol <= point[1] && point[1] <= y + h + tol;
    },
    line: (rect, line, options) => {
        return line.every(point => exports.contains.point(rect, point, options));
    },
    rect: (rect, other, options) => {
        const { tol = 0 } = options || {};
        const [x1, y1, w1, h1] = rect;
        const [x2, y2, w2, h2] = other;
        return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
    },
};
function toPoly(rect) {
    const [x, y, w, h] = rect;
    return [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
    ];
}
exports.to = {
    lines: (rect) => {
        const [x, y, w, h] = rect;
        return [
            [[x, y], [x + w, y]],
            [[x + w, y], [x + w, y + h]],
            [[x + w, y + h], [x, y + h]],
            [[x, y + h], [x, y]],
        ];
    },
    poly: toPoly,
    points: toPoly,
};
exports.dist = {
    point: (rect, point) => {
        if (exports.contains.point(rect, point)) {
            return 0;
        }
        else {
            return Math.min(...exports.to.lines(rect).map(line => lines.dist.point(line, point)));
        }
    },
    line: (rect, line) => {
        const [x, y, w, h] = rect;
        if (exports.to.lines(rect).some(other => lines.intersect.line(line, other))) {
            return 0;
        }
        else {
            return Math.min(Math.min(...exports.to.poly(rect).map(point => lines.dist.point(line, point))), Math.min(...line.map(point => exports.dist.point(rect, point))));
        }
    },
    rect: (rect, other) => {
        return Math.min(Math.min(...exports.to.poly(rect).map(point => exports.dist.point(other, point))), Math.min(...exports.to.poly(other).map(point => exports.dist.point(rect, point))));
    },
};
exports.intersect = {
    point: exports.contains.point,
    line: (rect, line, options) => {
        return exports.contains.line(rect, line, options) || exports.to.lines(rect).some(other => lines.intersect.line(line, other, options));
    },
    rect: (rect, other, options) => {
        return exports.contains.rect(rect, other, options) || exports.contains.rect(other, rect, options) || exports.to.lines(other).some(line => exports.intersect.line(rect, line, options));
    },
};
exports.random = {
    point: (rect) => {
        const [x, y, w, h] = rect;
        return [
            Math.random() * w + x,
            Math.random() * h + y,
        ];
    },
};
