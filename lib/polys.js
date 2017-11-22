'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const points = require("./points");
const lines = require("./lines");
const rects = require("./rects");
const turf = require("@turf/helpers");
const tdifference = require("@turf/difference");
const tintersect = require("@turf/intersect");
const tunion = require("@turf/union");
// FIXME Remove turf
function area(poly) {
    let area = 0;
    poly.forEach((curr, i) => {
        const next = poly[(i + 1) % poly.length];
        area += (next[0] - curr[0]) * (next[1] + curr[1]);
    });
    return Math.abs(area) / 2;
}
exports.area = area;
function perimeter(poly) {
    return exports.to.lines(poly).reduce((p, l) => p + lines.length(l), 0);
}
exports.perimeter = perimeter;
function equalOneDirection(poly, other, tol) {
    return poly.some((_, offset) => poly.every((p, i) => points.equal(p, other[(i + offset) % poly.length], { tol: tol })));
}
function equal(poly, other, options) {
    const { tol = 0 } = options || {};
    return poly.length === other.length && (equalOneDirection(poly, other, tol) || equalOneDirection(poly.slice().reverse(), other, tol));
}
exports.equal = equal;
function translate(poly, vec) {
    return poly.map(([x, y]) => [x + vec[0], y + vec[1]]);
}
exports.translate = translate;
function rotate(poly, angle) {
    return poly.map(([x, y]) => [
        Math.cos(angle) * x - Math.sin(angle) * y,
        Math.sin(angle) * x + Math.sin(angle) * y,
    ]);
}
exports.rotate = rotate;
exports.to = {
    lines: (poly) => {
        return poly.map((curr, i) => {
            const next = poly[(i + 1) % poly.length];
            return [curr, next];
        });
    },
    rect: (poly) => {
        let minx = Infinity;
        let miny = Infinity;
        let maxx = -Infinity;
        let maxy = -Infinity;
        poly.forEach(([x, y]) => {
            minx = Math.min(minx, x);
            miny = Math.min(miny, y);
            maxx = Math.max(maxx, x);
            maxy = Math.max(maxy, y);
        });
        return [minx, miny, maxx - minx, maxy - miny];
    },
};
exports.contains = {
    point: (poly, point, options) => {
        const linez = exports.to.lines(poly);
        const inside = linez.reduce((ins, line) => {
            const orient = lines.orientation(line, point);
            return (((line[0][1] <= point[1] && point[1] < line[1][1] && orient < 0) ||
                (point[1] < line[0][1] && line[1][1] <= point[1] && orient > 0))) !== ins;
        }, false);
        return inside || linez.some(line => lines.contains.point(line, point, options));
    },
};
exports.random = {
    point: (poly) => {
        const rect = exports.to.rect(poly);
        while (true) {
            const point = rects.random.point(rect);
            if (exports.contains.point(poly, point)) {
                return point;
            }
        }
    },
};
function convertPoly(coords) {
    if (coords.length === 1) {
        return coords[0].slice(0, -1);
    }
    else {
        return coords.map(poly => ({ poly: poly, area: area(poly) }))
            .reduce((a, b) => b.area > a.area ? b : a)
            .poly.slice(0, -1);
    }
}
function wrapTurf(func) {
    return (poly1, poly2) => {
        const t1 = turf.polygon([poly1.concat([poly1[0]])]);
        const t2 = turf.polygon([poly2.concat([poly2[0]])]);
        const res = func(t1, t2);
        if (!res) {
            return [];
        }
        else if (res.geometry.type === 'Polygon') {
            return [convertPoly(res.geometry.coordinates)];
        }
        else if (res.geometry.type === 'MultiPolygon') {
            return res.geometry.coordinates.map((coords) => convertPoly(coords));
        }
    };
}
exports.union = wrapTurf(tunion);
exports.intersect = wrapTurf(tintersect);
exports.difference = wrapTurf(tdifference);
