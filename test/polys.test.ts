import {} from "jest";
import * as check from "./check";
import * as lines from "../src/lines";
import * as polys from "../src/polys";
import * as rects from "../src/rects";


describe('#area()', () => {
  it('computes rect area', () => {
    check.almostEqual(polys.area(rects.to.poly([0, 0, 3, 4])), 12);
    check.almostEqual(polys.area(rects.to.poly([0, 0, 3, 4]).reverse()), 12);
  });

  it('computes triangle area', () => {
    check.almostEqual(polys.area([[0, 0], [3, 0], [4, 4]]), 6);
    check.almostEqual(polys.area([[0, 0], [4, 4], [3, 0]]), 6);
  });
});

describe('#contains.point()', () => {
  it('works for rects', () => {
    check(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [1, 1]));
    check(polys.contains.point(rects.to.poly([0, 0, 3, 3]).reverse(), [1, 1]));
    check(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [0, 0]));
    check(polys.contains.point(rects.to.poly([0, 0, 3, 3]), [0, 1]));

    check(!polys.contains.point(rects.to.poly([0, 0, 3, 3]), [4, 1]));
    check(!polys.contains.point(rects.to.poly([0, 0, 3, 3]).reverse(), [4, 1]));
  });

  it('works for triangles', () => {
    check(polys.contains.point([[0, 0], [4, 4], [3, 0]], [2, 1]));
    check(polys.contains.point([[0, 0], [4, 4], [3, 0]], [1, 1]));
    check(polys.contains.point([[0, 0], [4, 4], [3, 0]], [4, 4]));

    check(!polys.contains.point([[0, 0], [4, 4], [3, 0]], [2, 3]));
    check(!polys.contains.point([[0, 0], [4, 4], [3, 0]], [5, 1]));
  });
});

describe('#to.lines()', () => {
  it('works with default options', () => {
    const actual = polys.to.lines([[0, 0], [3, 0], [4, 4]]);
    const expected = [[[0, 0], [3, 0]], [[3, 0], [4, 4]], [[4, 4], [0, 0]]];
    check.unorderedEqual(actual, expected, lines.equal);
  });
});

describe('#union()', () => {
  it('works for a simple case', () => {
    const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
    const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
    const expected = [[[0, 0], [2, 0], [2, 1], [3, 1], [3, 3], [1, 3], [1, 2], [0, 2]]];
    check.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
  });

  it('removes hole in center', () => {
    const polya = [[0, 0], [5, 0], [5, 3], [3, 3], [3, 1], [2, 1], [2, 3], [0, 3]];
    const polyb = [[1, 2], [4, 2], [4, 4], [1, 4]];
    const expected = [[[0, 0], [5, 0], [5, 3], [4, 3], [4, 4], [1, 4], [1, 3], [0, 3]]];
    check.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
  });

  it('preserves disjoint polys', () => {
    const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
    const expected = [polya, polyb];
    check.unorderedEqual(expected, polys.union(polya, polyb), polys.equal);
  });
});

describe('#intersect()', () => {
  it('works for a simple case', () => {
    const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
    const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
    const expected = [[[1, 1], [2, 1], [2, 2], [1, 2]]];
    check.unorderedEqual(expected, polys.intersect(polya, polyb), polys.equal);
  });

  it('creates disjoint polys', () => {
    const polya = [[0, 0], [5, 0], [5, 3], [3, 3], [3, 1], [2, 1], [2, 3], [0, 3]];
    const polyb = [[1, 2], [4, 2], [4, 4], [1, 4]];
    const expected = [[[1, 2], [2, 2], [2, 3], [1, 3]], [[3, 2], [4, 2], [4, 3], [3, 3]]];
    check.unorderedEqual(expected, polys.intersect(polya, polyb), polys.equal);
  });

  it('returns empty on no intersection', () => {
    const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
    check.unorderedEqual([], polys.intersect(polya, polyb), polys.equal);
  });
});

describe('#difference()', () => {
  it('works for a simple case', () => {
    const polya = [[0, 0], [2, 0], [2, 2], [0, 2]];
    const polyb = [[1, 1], [3, 1], [3, 3], [1, 3]];
    const expected = [[[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]]];
    check.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
  });

  it('works for the opposite simple case', () => {
    const polya = [[1, 1], [3, 1], [3, 3], [1, 3]];
    const polyb = [[0, 0], [2, 0], [2, 2], [0, 2]];
    const expected = [[[2, 2], [2, 1], [3, 1], [3, 3], [1, 3], [1, 2]]];
    check.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
  });

  it('splits polys', () => {
    const polya = [[0, 0], [3, 0], [3, 1], [0, 1]];
    const polyb = [[1, -1], [2, -1], [2, 2], [1, 2]];
    const expected = [[[0, 0], [1, 0], [1, 1], [0, 1]], [[2, 0], [3, 0], [3, 1], [2, 1]]];
    check.unorderedEqual(expected, polys.difference(polya, polyb), polys.equal);
  });

  it('ignores empty differences', () => {
    const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const polyb = [[0, 2], [1, 2], [1, 3], [0, 3]];
    check.unorderedEqual([polya], polys.difference(polya, polyb), polys.equal);
  });

  it('returns empty differences', () => {
    const polya = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const polyb = [[-1, -1], [2, -1], [2, 2], [-1, 2]];
    check.unorderedEqual([], polys.difference(polya, polyb), polys.equal);
  });
});

describe('#equal()', () => {
  it('succeeds if equal', () => {
    check(polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [2, 0], [1, 1]]));
    check(polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [1, 1], [2, 0]]));
  });

  it('fails if not equal', () => {
    check(!polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 1], [2, 0], [1, 1]]));
    check(!polys.equal([[0, 0], [2, 0], [1, 1]], [[0, 0], [1, 1], [3, 0]]));
    check(!polys.equal([[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 2], [1, 2], [1, 3], [0, 3]]));
  });
});
