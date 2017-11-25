import {} from "jest";
import * as check from "./check";
import * as points from "../src/points";

describe('#equal()', () => {
  it('should succeed if equal', () => {
    check(points.equal([0, 0], [0, 0]));
    check(points.equal([1, 0], [1, 0]));
    check(points.equal([1, 1], [1, 1]));
  });

  it('should fail if not equal', () => {
    check(!points.equal([0, 0], [0, 1]));
    check(!points.equal([0, 1], [1, 1]));
  });
});

describe('#dist.point()', () => {
  it('works', () => {
    check.almostEqual(points.dist.point([0, 0], [0, 0]), 0);
    check.almostEqual(points.dist.point([0, 0], [1, 0]), 1);
    check.almostEqual(points.dist.point([0, 0], [1, 1]), Math.sqrt(2));
    check.almostEqual(points.dist.point([0, 0], [0, 1]), 1);
  });
});
