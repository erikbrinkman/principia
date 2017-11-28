"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fmin = require("fmin");
const quadprog = require("quadprog");
const curves = require("./curves");
const lines = require("./lines");
const points = require("./points");
const polys = require("./polys");
const rects = require("./rects");
const utils = require("./utils");
/** Minimize 0.5 x' q x - d' x st. a' x >= b
 *
 * Where x, d, b are vectors and q, a are matrices. This is just a wrapper
 * around quadprog to make it easier to call.
 */
function minqp(q, d, a, b) {
    // make arrays 1 indexed
    q = [[0]].concat(q.map(r => [0].concat(r)));
    a = [[0]].concat(a.map(r => [0].concat(r)));
    d = [0].concat(d);
    b = [0].concat(b);
    // solve
    const solution = quadprog.solveQP(q, d, a, b);
    return solution.solution.slice(1);
}
/** Space things apart on a line
 *
 * @param {[[num, num], ...]} elements An array of line segments that are
 * spaced apart so they no long overlap. Each element is an array of [position,
 * width], where position is the smallest point on the line. If you have a
 * number line like `0--1--2..3..4--5`, the elements array would like `[[0, 2],
 * [4, 1]]`.
 * @returns {[num]} The new positions of every element in parallel order.
 */
function space1(elements) {
    if (!elements.length) {
        return [];
    }
    // we sort elements so that we can enforce constraints
    const order = elements.map((_, i) => i)
        .sort((a, b) => elements[a][0] - elements[b][0]);
    // setup constraints
    const q = new Array(elements.length).fill(undefined).map((_, i) => {
        const row = new Array(elements.length).fill(0);
        row[i] = 1;
        return row;
    });
    const d = order.map(i => elements[i][0]);
    const a = new Array(elements.length).fill(undefined).map((_, i) => {
        const row = new Array(elements.length - 1).fill(0);
        if (i < elements.length - 1) {
            row[i] = -1;
        }
        if (i > 0) {
            row[i - 1] = 1;
        }
        return row;
    });
    const b = order.slice(0, -1).map(i => elements[i][1]);
    const solution = minqp(q, d, a, b);
    // invert ordering
    const result = Array(elements.length);
    order.forEach((i, j) => result[i] = solution[j]);
    return result;
}
exports.space1 = space1;
function pointsToArray(pointArray) {
    return [].concat(...pointArray);
}
function arrayToPoints(array) {
    const pointArray = new Array(array.length / 2).fill(undefined).map(_ => [0, 0]);
    array.forEach((c, i) => pointArray[Math.floor(i / 2)][i % 2] = c);
    return pointArray;
}
/** FIXME */
function initGenerator(bbox, boxes, curvez, buffer) {
    let valid = [rects.to.poly(bbox)];
    curvez.forEach(curve => curves.to.lines(curve).forEach(line => {
        const diff = lines.to.poly(line, { cap: lines.Cap.Square, width: buffer });
        valid = [].concat(...valid.map(vals => polys.difference(vals, diff)));
    }));
    const labelPolys = boxes.map(([width, height]) => {
        return [].concat(...valid.map(poly => {
            const shifts = [
                polys.translate(poly, [-width, 0]),
                polys.translate(poly, [-width, -height]),
                polys.translate(poly, [0, -height]),
            ];
            let diff = [poly];
            shifts.forEach(shift => {
                diff = [].concat(...diff.map(p => polys.intersect(p, shift)));
            });
            return diff;
        }));
    });
    const rands = labelPolys.map(ps => utils.randomIntWeighted(ps.map(p => polys.area(p))));
    return () => labelPolys.map((ps, i) => polys.random.point(ps[rands[i]()]));
}
/** FIXME */
function space2(bbox, boxes, curvez, options = {}) {
    // unpack options
    const { restarts = 10, penaltyIncs = 14, lineBuffer = 1, wSpread = -0.1, wOther = -0.2, } = options;
    // define loss function
    let penalty;
    function loss(array, _grad) {
        // TODO Add gradient and use conjugate gradient
        // grad = grad || points.slice();
        const point = arrayToPoints(array);
        // dist between each label and each line
        // TODO This is the slowest, and should be possible to speed up, i.e. we
        // don't need to actually compute the distance to every point, only the
        // nearest, which could be done via a nearest neighbor search. d3.quadtree?
        const dists = point.map((pi, i) => {
            const rect = pi.concat(boxes[i]);
            return curvez.map(curve => curves.dist.rect(curve, rect));
        });
        // dist between a label and its line
        const distToLines = utils.mean(dists.map((ds, i) => ds[i]));
        // dist between labels
        const distBetween = utils.mean([].concat(...point.map((pi, i) => point.slice(i + 1).map(pj => points.dist.point(pi, pj)))));
        // dist to other lines
        const distToOthers = utils.mean(dists.map((ds, i) => ds.length > 1
            ? Math.min(...ds.slice(0, i).concat(ds.slice(i + 1)))
            : 0));
        // penalty for being outside of boundary
        const boundaryPenalty = utils.sum(point.map((pi, i) => Math.pow(Math.max(...rects.to.points(pi.concat(boxes[i]))
            .map(p => rects.dist.point(bbox, p))), 2)));
        // penalty for being too close to any line
        const linePenalty = utils.sum(dists.map(ds => Math.pow(Math.max(0, lineBuffer -
            Math.min(...ds)), 2)));
        // all penalties
        return distToLines + wSpread * distBetween + wOther * distToOthers + (boundaryPenalty + linePenalty) * penalty;
    }
    // create generator
    const gen = initGenerator(bbox, boxes, curvez, lineBuffer);
    // find best over several random restarts
    let best = [];
    let bestLoss = Infinity;
    for (let i = 0; i < restarts; ++i) {
        let init = pointsToArray(gen());
        penalty = 1;
        // Slowly increase penalty for violating soft constraints
        for (let j = 0; j < penaltyIncs; ++j) {
            init = fmin.nelderMead(loss, init).x;
            penalty *= 2;
        }
        const l = loss(init);
        if (l < bestLoss || best.length === 0) {
            best = init;
            bestLoss = l;
        }
    }
    return arrayToPoints(best);
}
exports.space2 = space2;
