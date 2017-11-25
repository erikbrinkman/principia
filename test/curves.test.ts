import {} from "jest";
import * as check from "./check";
import * as curves from "../src/curves";
import * as lines from "../src/lines";


describe('#to.lines()', () => {
  it('works', () => {
    const actual = curves.to.lines([[0, 0], [3, 0], [4, 4]], {close: false});
    const expected = [[[0, 0], [3, 0]], [[3, 0], [4, 4]]];
    check.unorderedEqual(actual, expected, lines.equal);
  });
});

describe('#dist.point()', () => {
  it('works', () => {
    const curve =[[0, 3], [0, 0], [3, 0]];
    check.almostEqual(curves.dist.point(curve, [1, 2]), 1);
    check.almostEqual(curves.dist.point(curve, [2, 1]), 1);
  });
});
