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
function intersection(rect, other) {
    throw Error(); // FIXME
}
exports.intersection = intersection;
exports.contains = {
    point: ([x, y, w, h], [px, py], options = {}) => {
        const { tol = 0 } = options;
        return x - tol <= px && px <= x + w + tol && y - tol <= py && py <= y + h + tol;
    },
    line: (rect, line, options = {}) => {
        return line.every(point => exports.contains.point(rect, point, options));
    },
    rect: ([x1, y1, w1, h1], [x2, y2, w2, h2], options = {}) => {
        const { tol = 0 } = options;
        return x1 - tol <= x2 && x2 + w2 <= x1 + w1 + tol && y1 - tol <= y2 && y2 + h2 <= y1 + h1 + tol;
    },
};
function toPoly([x, y, w, h]) {
    return [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
    ];
}
exports.to = {
    lines: ([x, y, w, h]) => {
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
    line: (rect, line, options = {}) => {
        return exports.contains.line(rect, line, options) || exports.to.lines(rect).some(other => lines.intersect.line(line, other, options));
    },
    rect: (rect, other, options = {}) => {
        return exports.contains.rect(rect, other, options) || exports.contains.rect(other, rect, options) || exports.to.lines(other).some(line => exports.intersect.line(rect, line, options));
    },
};
exports.random = {
    point: ([x, y, w, h]) => {
        return [
            Math.random() * w + x,
            Math.random() * h + y,
        ];
    },
};
