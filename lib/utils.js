'use strict';

function randomIntWeighted(weights) {
  let sum = 0;
  let cumsum = [];
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
    return thresh.findIndex(t => rand <= t);
  }
}

module.exports.mean = array => array.reduce((m, v, i) => m + (v - m) / (i + 1), 0);
module.exports.sum = array => array.reduce((s, v) => s + v, 0);
module.exports.randomIntWeighted = randomIntWeighted;