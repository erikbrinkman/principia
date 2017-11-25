import {} from "jest";
import * as check from "./check";
import * as lines from "../src/lines";
import * as polys from "../src/polys";
import * as rects from "../src/rects";

describe('#dist.point()', () => {
  it('should return accurate distances for vertical lines', () => {
    const line = [[0, 0], [0, 3]];
    check.almostEqual(lines.dist.point(line, [1, 0]), 1);
    check.almostEqual(lines.dist.point(line, [1, 1.5]), 1);
    check.almostEqual(lines.dist.point(line, [1, 3]), 1);
    check.almostEqual(lines.dist.point(line, [3, 7]), 5);
    check.almostEqual(lines.dist.point(line, [-3, -4]), 5);
    check.almostEqual(lines.dist.point(line, [0, 1]), 0);
  });

  it('should return accurate distances for horizontal lines', () => {
    const line = [[0, 0], [3, 0]];
    check.almostEqual(lines.dist.point(line, [0, 1]), 1);
    check.almostEqual(lines.dist.point(line, [1.5, 1]), 1);
    check.almostEqual(lines.dist.point(line, [3, 1]), 1);
    check.almostEqual(lines.dist.point(line, [7, 3]), 5);
    check.almostEqual(lines.dist.point(line, [-3, -4]), 5);
    check.almostEqual(lines.dist.point(line, [1, 0]), 0);
  });

  it('should return accurate distances for oblique lines', () => {
    const line = [[1, 0], [0, 1]];
    check.almostEqual(lines.dist.point(line, [0.5, 0.5]), 0);
    check.almostEqual(lines.dist.point(line, [-1, 1]), 1);
    check.almostEqual(lines.dist.point(line, [0, 0]), Math.sqrt(0.5));
  });
});

describe('#intersect.line()', () => {
  it('should work for normal cases (no co-linear triples)', () => {
    check(lines.intersect.line([[0, 0], [1, 1]], [[1, 0], [0, 1]]));
    check(lines.intersect.line([[1, 0], [1, 2]], [[0, 1], [2, 1]]));
    check(lines.intersect.line([[1, 0], [1, 2]], [[0, 0], [2, 2]]));

    check(!lines.intersect.line([[1, 0], [1, 2]], [[3, 2], [3, 3]]));
    check(!lines.intersect.line([[1, 0], [1, 2]], [[2, 2], [3, 3]]));
  });

  it('should work for parallel cases', () => {
    check(lines.intersect.line([[0, 0], [0, 2]], [[0, 1], [0, 3]]));
    check(lines.intersect.line([[0, 0], [0, 2]], [[0, 1], [1, 1]]));
    check(lines.intersect.line([[0, 0], [0, 2]], [[1, 1], [0, 1]]));
    check(lines.intersect.line([[0, 1], [1, 1]], [[0, 0], [0, 2]]));
    check(lines.intersect.line([[1, 1], [0, 1]], [[0, 0], [0, 2]]));

    check(!lines.intersect.line([[0, 0], [0, 1]], [[0, 2], [0, 3]]));
    check(!lines.intersect.line([[0, 0], [0, -2]], [[0, 1], [1, 1]]));
    check(!lines.intersect.line([[0, 0], [0, -2]], [[1, 1], [0, 1]]));
    check(!lines.intersect.line([[0, 1], [1, 1]], [[0, 0], [0, -2]]));
    check(!lines.intersect.line([[1, 1], [0, 1]], [[0, 0], [0, -2]]));
  });
});

describe('#to.poly()', () => {
  it('works for cap default', () => {
    check(polys.equal(
      lines.to.poly([[0, 0], [0, 1]]),
      [[-1, 0], [1, 0], [1, 1], [-1, 1]]));
    check(polys.equal(
      lines.to.poly([[0, 0], [3, 4]], {width: 5}),
      [[-4, 3], [4, -3], [7, 1], [-1, 7]]));
  });

  it('works for cap butt', () => {
    check(polys.equal(
      lines.to.poly([[0, 0], [0, 1]], {cap: 'butt'}),
      [[-1, 0], [1, 0], [1, 1], [-1, 1]]));
    check(polys.equal(
      lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'butt'}),
      [[-4, 3], [4, -3], [7, 1], [-1, 7]]));
  });

  it('works for cap square', () => {
    check(polys.equal(
      lines.to.poly([[0, 0], [0, 1]], {cap: 'square'}),
      [[-1, -1], [1, -1], [1, 2], [-1, 2]]));
    check(polys.equal(
      lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'square'}),
      [[-7, -1], [1, -7], [10, 5], [2, 11]]));
  });

  it('works for cap angle', () => {
    check(polys.equal(
      lines.to.poly([[0, 0], [0, 1]], {cap: 'angle'}),
      [[-1, 0], [0, -1], [1, 0], [1, 1], [0, 2], [-1, 1]]));
    check(polys.equal(
      lines.to.poly([[0, 0], [3, 4]], {width: 5, cap: 'angle'}),
      [[-4, 3], [-3, -4], [4, -3], [7, 1], [6, 8], [-1, 7]]));
  });

  it('throws for unknown cap', () => {
    check.throws(() => lines.to.poly([[0, 0], [0, 1]], {cap: 'foo'}));
  });
});

describe('#to.rect()', () => {
  it('works', () => {
    check(rects.equal(
      lines.to.rect([[0, 0], [1, 1]]),
      [0, 0, 1, 1]));
    check(rects.equal(
      lines.to.rect([[0, 0], [0, 1]]),
      [0, 0, 0, 1]));
    check(rects.equal(
      lines.to.rect([[0, 0], [1, 0]]),
      [0, 0, 1, 0]));
    check(rects.equal(
      lines.to.rect([[0, 0], [0, 0]]),
      [0, 0, 0, 0]));
  });
});

describe('#orientation()', () => {
  it('it returns 0 for co-linear points', () => {
    check.equal(lines.orientation([[0, 0], [1, 1]], [2, 2]), 0);
    check.equal(lines.orientation([[0, 0], [1, 1]], [2, 2.01], {tol: 0.1}), 0);
  });

  it('it returns 1 for right points', () => {
    check.equal(lines.orientation([[0, 0], [1, 1]], [1, 0]), 1);
  });

  it('it returns -1 for left points', () => {
    check.equal(lines.orientation([[0, 0], [1, 1]], [0, 1]), -1);
  });
});

describe('#equal()', () => {
  it('should succeed if equal', () => {
    check(lines.equal([[0, 0], [1, 1]], [[0, 0], [1, 1]]));
    check(lines.equal([[0, 0], [1, 1]], [[1, 1], [0, 0]]));
  });

  it('should fail if not equal', () => {
    check(!lines.equal([[0, 0], [1, 1]], [[1, 0], [0, 1]]));
    check(!lines.equal([[0, 0], [1, 1]], [[0, 1], [1, 0]]));
  });
});
