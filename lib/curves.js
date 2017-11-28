"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lines = require("./lines");
const rects = require("./rects");
exports.to = {
    lines: (curve) => {
        return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]]);
    },
};
exports.dist = {
    point: (curve, point) => {
        return Math.min(...exports.to.lines(curve).map(line => lines.dist.point(line, point)));
    },
    rect: (curve, rect) => {
        return Math.min(...exports.to.lines(curve).map(line => rects.dist.line(rect, line)));
    },
};
exports.intersect = {
    rect: (curve, rect, options = {}) => {
        return exports.to.lines(curve).some(line => rects.intersect.line(rect, line, options));
    },
};
