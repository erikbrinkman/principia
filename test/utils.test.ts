import {} from "jest";
import * as check from "./check";
import * as utils from "../src/utils";


describe('#mean()', () => {
  it('returns the mean', () => {
    check.almostEqual(utils.mean([1]), 1);
    check.almostEqual(utils.mean([1, 2, 3]), 2);
  });

  it('returns 0 when empty', () => {
    check.almostEqual(utils.mean([]), 0);
  });
});

describe('#sum()', () => {
  it('returns the mean', () => {
    check.almostEqual(utils.sum([1]), 1);
    check.almostEqual(utils.sum([1, 2, 3]), 6);
  });

  it('returns 0 when empty', () => {
    check.almostEqual(utils.sum([]), 0);
  });
});

describe('#randomIntWeighted()', () => {
  it('always returns an int in range', () => {
    for (let i = 1; i < 5; ++i) {
      check(new Array(100).fill(null).every(_ => {
        const rand = utils.randomIntWeighted(new Array(i).fill(null).map(_ => Math.random()));
        return new Array(100).fill(null).every(_ => {
          const ind = rand();
          return 0 <= ind && ind < i;
        });
      }));
    }
  });
});
