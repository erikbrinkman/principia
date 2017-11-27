"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// FIXME Document
function mean(array) {
    return array.reduce((m, v, i) => m + (v - m) / (i + 1), 0);
}
exports.mean = mean;
function sum(array) {
    return array.reduce((s, v) => s + v, 0);
}
exports.sum = sum;
function randomIntWeighted(weights) {
    let sum = 0;
    const cumsum = [];
    weights.forEach(v => {
        sum += v;
        cumsum.push(sum);
    });
    const total = cumsum[cumsum.length - 1];
    const thresh = cumsum.map(v => v / total);
    return () => {
        const rand = Math.random();
        // TODO Could be made faster with binary search (loDash?)
        // XXX loDash also provides mean and sum
        // FIXME This looks wrong
        return thresh.findIndex(t => rand <= t);
    };
}
exports.randomIntWeighted = randomIntWeighted;
