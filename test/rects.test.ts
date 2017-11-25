import {} from "jest";
import * as check from "./check";
import * as lines from "../src/lines";
import * as points from "../src/points";
import * as polys from "../src/polys";
import * as rects from "../src/rects";


describe('#dist.point()', () => {
  it('returns 0 inside', () => {
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [1, 1]), 0);
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [0, 1]), 0);
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [0, 0]), 0);
  });

  it('transfers across lines appropriately', () => {
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [2, 4]), 2);
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [3, 3]), Math.sqrt(2));
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [4, 2]), 2);
  });

  it('appropriately calculates distance from a side', () => {
    check.almostEqual(rects.dist.point([0, 0, 2, 2], [4, 1]), 2);
  });
});

describe('#dist.line()', () => {
  it('returns 0 if inside', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[1, 1], [2, 2]]), 0);
  });

  it('returns 0 if one endpoint inside', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 2], [4, 2]]), 0);
  });

  it('returns 0 if it crosses through', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[1, 4], [4, 1]]), 0);
  });

  it('returns 0 if it touches a corner', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 4], [4, 2]]), 0);
  });

  it('returns 0 if it touches a side', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[-1, 3], [4, 3]]), 0);
  });

  it('returns returns minimum dist to line', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[3, 4], [4, 3]]), Math.sqrt(0.5));
  });

  it('returns returns minimum dist to size', () => {
    check.almostEqual(rects.dist.line([0, 0, 3, 3], [[2, 4], [2, 5]]), 1);
  });
});

describe('#to.lines()', () => {
  it('works', () => {
    const expected = [[[0, 0], [3, 0]], [[3, 0], [3, 3]], [[3, 3], [0, 3]], [[0, 3], [0, 0]]];
    const actual = rects.to.lines([0, 0, 3, 3]);
    check.unorderedEqual(expected, actual, lines.equal);
  });
});

describe('#to.poly()', () => {
  it('works', () => {
    check(polys.equal(
      rects.to.poly([0, 0, 3, 3]),
      [[0, 0], [3, 0], [3, 3], [0, 3]]));
  });
});

describe('#to.points()', () => {
  it('works', () => {
    const expected = [[0, 0], [3, 0], [3, 3], [0, 3]];
    const actual = rects.to.points([0, 0, 3, 3]);
    check.unorderedEqual(expected, actual, points.equal);
  });
});

describe('#contains.point()', () => {
  it('succeeds inside', () => {
    check(rects.contains.point([0, 0, 3, 3], [1, 1]));
  });

  it('succeeds on side', () => {
    check(rects.contains.point([0, 0, 3, 3], [0, 1]));
  });

  it('succeeds on corner', () => {
    check(rects.contains.point([0, 0, 3, 3], [0, 0]));
  });

  it('fails next to side', () => {
    check(!rects.contains.point([0, 0, 3, 3], [4, 1]));
  });

  it('fails next to corner', () => {
    check(!rects.contains.point([0, 0, 3, 3], [4, 4]));
  });
});

describe('#contains.line()', () => {
  it('succeeds inside', () => {
    check(rects.contains.line([0, 0, 3, 3], [[1, 1], [2, 2]]));
  });

  it('succeeds when one on side', () => {
    check(rects.contains.line([0, 0, 3, 3], [[1, 1], [0, 1]]));
  });

  it('succeeds when one on corner', () => {
    check(rects.contains.line([0, 0, 3, 3], [[1, 1], [0, 0]]));
  });

  it('fails when one next to side', () => {
    check(!rects.contains.line([0, 0, 3, 3], [[1, 1], [4, 1]]));
  });

  it('fails when one next to corner', () => {
    check(!rects.contains.line([0, 0, 3, 3], [[1, 1], [4, 4]]));
  });

  it('fails when both outside', () => {
    check(!rects.contains.line([0, 0, 3, 3], [[4, 4], [4, 1]]));
  });
});

describe('#intersect.point()', () => {
  it('succeeds inside', () => {
    check(rects.intersect.point([0, 0, 3, 3], [1, 1]));
  });

  it('succeeds on side', () => {
    check(rects.intersect.point([0, 0, 3, 3], [0, 1]));
  });

  it('succeeds on corner', () => {
    check(rects.intersect.point([0, 0, 3, 3], [0, 0]));
  });

  it('fails next to side', () => {
    check(!rects.intersect.point([0, 0, 3, 3], [4, 1]));
  });

  it('fails next to corner', () => {
    check(!rects.intersect.point([0, 0, 3, 3], [4, 4]));
  });
});

describe('#intersect.line()', () => {
  it('succeeds inside', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[1, 1], [2, 2]]));
  });

  it('succeeds when one on side', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[1, 1], [0, 1]]));
  });

  it('succeeds when one on corner', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[1, 1], [0, 0]]));
  });

  it('succeeds when one next to side', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[1, 1], [4, 1]]));
  });

  it('succeeds when one next to corner', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[1, 1], [4, 4]]));
  });

  it('succeeds when one on side and one outside', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[3, 1], [4, 4]]));
  });

  it('succeeds when one on corner and one outside', () => {
    check(rects.intersect.line([0, 0, 3, 3], [[3, 3], [4, 4]]));
  });

  it('fails when both outside', () => {
    check(!rects.intersect.line([0, 0, 3, 3], [[4, 4], [4, 1]]));
  });
});

describe('#equal()', () => {
  it('should succeed if equal', () => {
    check(rects.equal([0, 0, 1, 1], [0, 0, 1, 1]));
  });

  it('should fail if not equal', () => {
    check(!rects.equal([0, 0, 1, 1], [1, 0, 1, 1]));
    check(!rects.equal([0, 0, 1, 1], [0, 1, 1, 1]));
    check(!rects.equal([0, 0, 1, 1], [0, 0, 0, 1]));
    check(!rects.equal([0, 0, 1, 1], [0, 0, 1, 0]));
  });
});
