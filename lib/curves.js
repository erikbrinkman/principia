"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lines = require("./lines");
const rects = require("./rects");
var to;
(function (to) {
    function lines(curve) {
        return curve.slice(0, -1).map((point, i) => [point, curve[i + 1]]);
    }
    to.lines = lines;
})(to = exports.to || (exports.to = {}));
var dist;
(function (dist) {
    function point(curve, point) {
        return Math.min(...to.lines(curve).map(line => lines.dist.point(line, point)));
    }
    dist.point = point;
    function rect(curve, rect) {
        return Math.min(...to.lines(curve).map(line => rects.dist.line(rect, line)));
    }
    dist.rect = rect;
})(dist = exports.dist || (exports.dist = {}));
var intersect;
(function (intersect) {
    function rect(curve, rect, options = {}) {
        return to.lines(curve).some(line => rects.intersect.line(rect, line, options));
    }
    intersect.rect = rect;
})(intersect = exports.intersect || (exports.intersect = {}));
