// FIXME Document
export function mean(array: number[]): number {
  return array.reduce((m, v, i) => m + (v - m) / (i + 1), 0);
}

export function sum(array: number[]): number {
  return array.reduce((s, v) => s + v, 0);
}

export function randomIntWeighted(weights: number[]): () => number {
  let sum = 0;
  const cumsum: number[] = [];
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
  };
}
