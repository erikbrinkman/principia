import * as  assert from "assert";


assert.almostEqual = (a: number, b: number, message?: string, tol?: number) => {
  assert(Math.abs(a - b) <= (tol || 1e-6), message || `${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};

assert.unorderedEqual = (a, b, pred) => {
  pred = pred || ((a, b) => a === b);
  assert.equal(a.length, b.length);
  const found = new Array(a.length).fill(false);
  a.forEach(ai => {
    const ind = b.findIndex(bi => pred(ai, bi));
    if (ind >= 0) {
      found[ind] = true;
    }
  });
  assert(found.every(x => x), `${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
};

export = assert
