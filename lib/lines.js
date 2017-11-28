"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const points = require("./points");
const rects = require("./rects");
/** Helper function if point is in rectangle defined by line */
function rectContainsPoint(line, point, options = {}) {
    return rects.contains.point(exports.to.rect(line), point, options);
}
/** find orientation of point relative to line 1 for right, -1 for left */
function orientation([[l1x, l1y], [l2x, l2y]], [px, py], options = {}) {
    const { tol = 0 } = options;
    const val = (l2y - l1y) * (px - l2x) - (l2x - l1x) * (py - l2y);
    return Math.abs(val) <= tol ? 0 : Math.sign(val);
}
exports.orientation = orientation;
function intersection(line, other) {
    throw Error(); // FIXME
}
exports.intersection = intersection;
function length([p1, p2]) {
    return points.dist.point(p1, p2);
}
exports.length = length;
function equal([l1, l2], [o1, o2], options = {}) {
    return (points.equal(l1, o1, options) && points.equal(l2, o2, options))
        || (points.equal(l1, o2, options) && points.equal(l2, o1, options));
}
exports.equal = equal;
exports.contains = {
    point: (line, point, options = {}) => {
        return orientation(line, point, options) === 0 && rectContainsPoint(line, point, options);
    },
};
exports.dist = {
    point: ([[l1x, l1y], [l2x, l2y]], [px, py]) => {
        // TODO detect if line is degenerate
        const rx = px - l1x;
        const ry = py - l1y;
        const lx = l2x - l1x;
        const ly = l2y - l1y;
        const c = (rx * lx + ry * ly) / (lx * lx + ly * ly);
        const u = Math.min(Math.max(0, c), 1);
        return Math.sqrt(Math.pow((rx - u * lx), 2) + Math.pow((ry - u * ly), 2));
    },
};
exports.intersect = {
    point: exports.contains.point,
    line: (line, other, options = {}) => {
        const [l1, l2] = line;
        const [o1, o2] = other;
        // Find the four orientations
        const or1 = orientation(line, o1, options);
        const or2 = orientation(line, o2, options);
        const or3 = orientation(other, l1, options);
        const or4 = orientation(other, l2, options);
        // General case
        return (or1 !== or2 && or3 !== or4)
            // Special co-linearity cases
            || (or1 === 0 && rectContainsPoint(line, o1, options))
            || (or2 === 0 && rectContainsPoint(line, o2, options))
            || (or3 === 0 && rectContainsPoint(other, l1, options))
            || (or4 === 0 && rectContainsPoint(other, l2, options));
    },
};
exports.to = {
    // FIXME Change cap to enum?
    poly: ([[l1x, l1y], [l2x, l2y]], options = {}) => {
        const { cap = "butt", width = 1 } = options;
        let vx = l2x - l1x;
        let vy = l2y - l1y;
        const mag = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2)) / width;
        vx /= mag;
        vy /= mag;
        switch (cap) {
            case "butt":
                return [
                    [l1x - vy, l1y + vx],
                    [l1x + vy, l1y - vx],
                    [l2x + vy, l2y - vx],
                    [l2x - vy, l2y + vx],
                ];
            case "square":
                return [
                    [l1x - vx - vy, l1y - vy + vx],
                    [l1x - vx + vy, l1y - vy - vx],
                    [l2x + vx + vy, l2y + vy - vx],
                    [l2x + vx - vy, l2y + vy + vx],
                ];
            case "angle":
                return [
                    [l1x - vy, l1y + vx],
                    [l1x - vx, l1y - vy],
                    [l1x + vy, l1y - vx],
                    [l2x + vy, l2y - vx],
                    [l2x + vx, l2y + vy],
                    [l2x - vy, l2y + vx],
                ];
            default:
                throw Error(`unknown cap: "${cap}"`);
        }
    },
    rect: ([[l1x, l1y], [l2x, l2y]]) => {
        const maxx = Math.max(l1x, l2x);
        const minx = Math.min(l1x, l2x);
        const maxy = Math.max(l1y, l2y);
        const miny = Math.min(l1y, l2y);
        return [minx, miny, maxx - minx, maxy - miny];
    },
    points: (line) => {
        return line;
    },
};
exports.random = {
    point: ([[l1x, l1y], [l2x, l2y]]) => {
        const rand = Math.random();
        return [
            l1x + rand * (l2x - l1x),
            l1y + rand * (l2y - l1y),
        ];
    },
};
